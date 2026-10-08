export function resistance(a,b,n) {
 if (![a,b,n].every(Number.isInteger)||a<1||a>9||b<0||b>9||n<0||n>9) throw new RangeError("Bandes fora de rang");
 return (10*a+b)*10**n;
}
