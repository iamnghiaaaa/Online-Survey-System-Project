/** Chuẩn hóa lựa chọn (string legacy hoặc { text, imageUrl }). */
export function getOptionText(opt) {
  if (opt == null) return '';
  if (typeof opt === 'string') return opt;
  return typeof opt.text === 'string' ? opt.text : '';
}

export function getOptionImage(opt) {
  if (opt == null || typeof opt === 'string') return '';
  return typeof opt.imageUrl === 'string' ? opt.imageUrl : '';
}

export function normalizeOptionForForm(opt) {
  if (typeof opt === 'string') return { text: opt, imageUrl: '' };
  return {
    text: typeof opt?.text === 'string' ? opt.text : '',
    imageUrl: typeof opt?.imageUrl === 'string' ? opt.imageUrl : '',
  };
}
