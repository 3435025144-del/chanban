import fs from 'node:fs';
import path from 'node:path';

const root = 'C:/Users/34350/Desktop/chanban';
const dist = path.join(root, 'dist');
const out = 'C:/Users/34350/Desktop/馋伴.html';

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

html = html.replace(/<script>\s*\/\/[\s\S]*?location\.protocol[\s\S]*?<\/script>/, '');

const jsFile = fs.readdirSync(path.join(dist, 'assets')).find((f) => f.endsWith('.js'));
const cssFile = fs.readdirSync(path.join(dist, 'assets')).find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('dist assets not found');

const js = fs.readFileSync(path.join(dist, 'assets', jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8');

html = html.replace(/<script type="module"[^>]*><\/script>/, `<script type="module">\n${js}\n</script>`);
html = html.replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}\n</style>`);

fs.writeFileSync(out, html, 'utf8');
console.log(`written ${out} (${html.length} chars)`);
