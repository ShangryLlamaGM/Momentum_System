export const t = (key, data={}) => game.i18n.localize(key, data) ?? key;
export const format = (key, data={}) => game.i18n.format(key, data);
