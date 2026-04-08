const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

const code = (n: number) => (useColor ? `\x1b[${n}m` : '');
const reset = code(0);
const green = code(32);
const yellow = code(33);
const red = code(31);
const cyan = code(36);
const dim = code(2);

export function info(msg: string) {
  console.log(`${cyan}i${reset} ${msg}`);
}

export function success(msg: string) {
  console.log(`${green}✓${reset} ${msg}`);
}

export function warn(msg: string) {
  console.log(`${yellow}!${reset} ${msg}`);
}

export function error(msg: string) {
  console.error(`${red}✗${reset} ${msg}`);
}

export function detail(msg: string) {
  console.log(`  ${dim}${msg}${reset}`);
}
