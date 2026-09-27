export const isAvailableAsync = async () => true;
export const shareAsync = async (url) => {
  if (typeof window !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SonicCraft_Audio';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
export default { isAvailableAsync, shareAsync };
