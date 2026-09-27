export const documentDirectory = null;
export const cacheDirectory = null;
export const downloadAsync = async (url) => ({ uri: url, status: 200 });
export const getInfoAsync = async () => ({ exists: true, size: 3500000 });
export const deleteAsync = async () => {};
export default { documentDirectory, cacheDirectory, downloadAsync, getInfoAsync, deleteAsync };
