import QRCode from 'qrcode'; export const tokenToQR=(t)=>QRCode.toDataURL(t,{width:420,margin:1});
