import { useData } from '@/context/DataContext';
import FormModal from './FormModal';

/**
 * نافذة إضافة/تعديل لأي مجموعة بيانات.
 * state: { item?: العنصر عند التعديل, defaults?: قيم افتراضية عند الإضافة } أو null لإخفائها.
 */
export default function EntityModal({ state, onClose, collection, entityName, fields }) {
  const { addItem, updateItem, removeItem } = useData();
  if (!state) return null;
  const isEdit = Boolean(state.item);

  return (
    <FormModal
      title={`${isEdit ? 'تعديل' : 'إضافة'} ${entityName}`}
      fields={fields}
      initial={state.item ?? state.defaults ?? {}}
      onSave={(v) => (isEdit ? updateItem(collection, state.item.id, v) : addItem(collection, v))}
      onDelete={isEdit ? () => removeItem(collection, state.item.id) : undefined}
      onClose={onClose}
    />
  );
}
