import json, time, urllib.request
from playwright.sync_api import sync_playwright, expect

URL = 'http://localhost:4180/'
MOCK = 'http://localhost:54321'
OWNER, STRANGER, PW = 'owner@test.dev', 'stranger@test.dev', 'pw12345'
def api(p): return json.load(urllib.request.urlopen(MOCK + p))
api('/__reset')

SEED = """
if (!sessionStorage.getItem('__seeded')) {
  sessionStorage.setItem('__seeded','1');
  localStorage.setItem('cd:applications', JSON.stringify([{id:'a1',company:'SECRET-CORP',role:'Spy',status:'monitoring',outcome:'',date:'',portalUrl:'',opensAt:'',closesAt:'',contact:'',notes:'',cvId:'',files:[]}]));
  localStorage.setItem('cd:projects', JSON.stringify([{id:'p1',title:'Public Proj',status:'done',description:'d',tech:['React'],github:'https://github.com/a/b',demo:'https://x.dev'}]));
}
"""
results = []
def ok(name): results.append(name); print('ok', len(results), '-', name)

def nav(page, text): page.locator('button:visible').filter(has_text=text).first.click()

def login(page, email, pw=PW):
    page.get_by_role('button', name='تسجيل دخول المالك').click()
    page.get_by_label('البريد الإلكتروني').fill(email)
    page.get_by_label('كلمة المرور').fill(pw)
    page.get_by_role('button', name='دخول', exact=True).click()

with sync_playwright() as p:
    b = p.chromium.launch()
    errors = []
    def mk(init=None):
        c = b.new_context(viewport={'width': 1200, 'height': 800}, locale='ar')
        if init: c.add_init_script(init)
        pg = c.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        return c, pg

    # ---------- 1) زائر مجهول ----------
    vc, v = mk()
    v.goto(URL); v.wait_for_selector('h1')
    expect(v.locator('h1')).to_have_text('Portfolio')
    body = v.inner_text('body')
    assert 'لوحة التحكم' not in body and 'التقديمات والمقابلات' not in body and 'المسار الأكاديمي' not in body
    assert 'المهارات والمشاريع' in body
    assert v.get_by_role('button', name='تبديل الوضع').count() == 0, 'زر Private/Public مخفي عن الزائر'
    ok('الزائر: يرى المعرض العام فقط، لا صفحات خاصة ولا زر تبديل الوضع')

    # محاولة تحايل: فرض الوضع الخاص عبر التخزين
    v.evaluate("localStorage.setItem('cd:mode', JSON.stringify('private'))"); v.reload(); v.wait_for_selector('h1')
    expect(v.locator('h1')).to_have_text('Portfolio')
    assert 'لوحة التحكم' not in v.inner_text('body')
    ok('الزائر: فرض mode=private في التخزين لا يفتح الوضع الخاص')

    # ---------- 2) مالك على اللابتوب مع بيانات محلية قديمة ----------
    lc, lap = mk(SEED)
    lap.goto(URL); lap.wait_for_selector('h1')
    assert 'SECRET-CORP' not in lap.inner_text('body')
    login(lap, 'wrong@x.com')
    expect(lap.get_by_role('alert')).to_contain_text('غير صحيحة')
    ok('كلمة مرور/بريد خاطئ: رسالة خطأ ولا دخول')
    lap.get_by_label('البريد الإلكتروني').fill(OWNER); lap.get_by_label('كلمة المرور').fill(PW)
    lap.get_by_role('button', name='دخول', exact=True).click()
    expect(lap.locator('h1')).to_have_text('مساري الأكاديمي والمهني', timeout=8000)
    expect(lap.get_by_role('button', name='تبديل الوضع')).to_be_visible()
    for label in ['لوحة التحكم', 'المسار الأكاديمي', 'التقديمات والمقابلات']:
        assert label in lap.inner_text('body'), label
    ok('المالك: يسجّل الدخول ويرى كل الصفحات')
    lap.wait_for_function("document.querySelector('[data-testid=sync-badge]')?.dataset.state === 'synced'", timeout=8000)
    rows = {r['key']: r for r in api('/__rows')}
    assert 'applications' in rows and rows['applications']['value'][0]['company'] == 'SECRET-CORP'
    assert rows['projects']['value'][0]['title'] == 'Public Proj'
    assert 'theme' not in rows and 'mode' not in rows
    ok('أول دخول: البيانات المحلية القديمة رُفعت للسحابة (والـ theme/mode لم تُرفع)')

    # ---------- 3) الجوال: جهاز جديد بلا بيانات ----------
    pc, ph = mk()
    ph.set_viewport_size({'width': 390, 'height': 800})
    ph.goto(URL); ph.wait_for_selector('h1')
    login(ph, OWNER)
    expect(ph.locator('h1')).to_have_text('مساري الأكاديمي والمهني', timeout=8000)
    nav(ph, 'التقديمات والمقابلات')
    expect(ph.get_by_text('SECRET-CORP').first).to_be_visible(timeout=6000)
    ok('الجوال (جهاز جديد): بعد الدخول تظهر بيانات اللابتوب الخاصة من السحابة')
    nav(ph, 'المهارات والمشاريع')
    expect(ph.get_by_text('Public Proj').first).to_be_visible()

    # ---------- 4) تزامن حي: إضافة مشروع على اللابتوب تظهر على الجوال والزائر ----------
    v.reload(); v.wait_for_selector('h1')
    v.get_by_text('Public Proj').first.wait_for(timeout=6000)
    nav(lap, 'المهارات والمشاريع')
    lap.get_by_role('button', name='إضافة مشروع').click()
    lap.get_by_label('اسم المشروع').fill('Live Sync Project')
    lap.get_by_role('button', name='إضافة', exact=True).click()
    expect(ph.get_by_text('Live Sync Project').first).to_be_visible(timeout=5000)
    ok('Realtime: مشروع أُضيف على اللابتوب ظهر على الجوال فوراً بدون إعادة تحميل')
    expect(v.get_by_text('Live Sync Project').first).to_be_visible(timeout=5000)
    ok('Realtime: ظهر أيضاً عند الزائر العام (بيانات عامة)')

    # ---------- 5) الزائر لا يصل للبيانات الخاصة إطلاقاً ----------
    assert 'SECRET-CORP' not in v.inner_text('body')
    ls = v.evaluate("Object.keys(localStorage)")
    assert not any(k in ls for k in ['cd:applications','cd:courses','cd:settings','cd:cvs','cd:interviews']), ls
    for r in api('/__log'):
        if r.startswith('select as anon'): assert 'in.(projects,skills,certs)' in r.replace('%2C', ',').replace('%28','(').replace('%29',')'), r
    ok('الزائر: لا SECRET-CORP في الصفحة، ولا مفاتيح خاصة في المتصفح، وطلباته مقصورة على المفاتيح العامة')
    # RLS (محاكاة السيرفر): كتابة الزائر عبر REST مباشرة مرفوضة
    code = v.evaluate("""async () => (await fetch('http://localhost:54321/rest/v1/app_data?on_conflict=key', {method:'POST', headers:{'content-type':'application/json', apikey:'anon-key', authorization:'Bearer anon-key'}, body: JSON.stringify({key:'projects', value:[], updated_at:new Date().toISOString()})})).status""")
    assert code == 401
    assert api('/__rows') and any(r['key']=='projects' and len(r['value'])==2 for r in api('/__rows'))
    ok('كتابة مباشرة من الزائر عبر REST مرفوضة والبيانات لم تتغير')

    # ---------- 6) حساب مسجّل لكن ليس المالك ----------
    sc, s = mk()
    s.goto(URL); s.wait_for_selector('h1')
    login(s, STRANGER)
    expect(s.get_by_role('alert')).to_contain_text('غير مصرّح', timeout=8000)
    s.keyboard.press('Escape')
    expect(s.locator('h1')).to_have_text('Portfolio')
    assert 'لوحة التحكم' not in s.inner_text('body')
    ok('حساب غير المالك: يُرفض مع رسالة ويبقى زائراً')

    # ---------- 7) بلا إنترنت على الجوال ثم عودة الاتصال ----------
    pc.set_offline(True)
    ph.get_by_role('button', name='إضافة مشروع').click()
    ph.get_by_label('اسم المشروع').fill('Offline Project')
    ph.get_by_role('button', name='إضافة', exact=True).click()
    expect(ph.get_by_text('Offline Project').first).to_be_visible()
    ph.wait_for_function("['offline','pending'].includes(document.querySelector('[data-testid=sync-badge]')?.dataset.state)", timeout=15000)
    assert not any(r['key']=='projects' and any(x['title']=='Offline Project' for x in r['value']) for r in api('/__rows'))
    ph.reload() if False else None
    ok('بلا إنترنت: التعديل يظهر محلياً وحالة المزامنة offline/pending ولم يصل للسحابة')
    pc.set_offline(False)
    ph.evaluate("window.dispatchEvent(new Event('online'))")
    expect(lap.get_by_text('Offline Project').first).to_be_visible(timeout=15000)
    ok('عند عودة الاتصال: التعديل رُفع تلقائياً وظهر على اللابتوب')

    # ---------- 8) تسجيل الخروج يمسح البيانات الخاصة من الجهاز ----------
    lap.get_by_role('button', name='تسجيل الخروج').click()
    expect(lap.locator('h1')).to_have_text('Portfolio', timeout=8000)
    keys = lap.evaluate("Object.keys(localStorage)")
    PRIV = ['applications','courses','settings','cvs','interviews','sprints','cheatSheet','bugLog','focusLog']
    assert not any('cd:'+k in keys for k in PRIV), keys
    leftover = lap.evaluate("(localStorage.getItem('cd:__meta')||'') + (localStorage.getItem('cd:__outbox')||'')")
    assert not any(k in leftover for k in PRIV), leftover
    assert 'SECRET-CORP' not in lap.inner_text('body')
    ok('الخروج: تُمسح البيانات الخاصة من المتصفح ويعود للوضع العام')

    # ---------- 9) إعادة تحميل بجلسة مالك محفوظة ----------
    ph.reload(); expect(ph.locator('h1')).to_have_text('مساري الأكاديمي والمهني', timeout=8000)
    ok('إعادة التحميل: الجلسة محفوظة والمالك يبقى مسجّلاً')
    assert not errors, errors
    b.close()
print(f'\nالكل نجح: {len(results)}')
