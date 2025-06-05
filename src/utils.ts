export const escapeHtml = (str: string): string => {
    return str.replace(/[&<>"']/g, (char) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]!)
    );
}
