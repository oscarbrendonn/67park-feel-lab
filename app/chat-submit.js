// A failed sender/overlay must not prevent the caller from releasing chat focus.
export function submitParkChat(client,text,showSpeech){
 if(typeof text!=='string'||!text.trim())return {accepted:false};
 const previous=client.chat?.at(-1);let error=null;
 try{client.sendChat(text.slice(0,140));}catch(cause){error=cause;}
 const sent=client.chat?.at(-1),accepted=!!sent&&sent!==previous;
 if(accepted)try{showSpeech(sent.text);}catch(cause){error??=cause;}
 return {accepted,error};
}
