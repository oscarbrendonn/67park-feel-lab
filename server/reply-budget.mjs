// Rejecting or replaying a command must not amplify an input flood into an
// equally large output queue. No timer or deferred replies; player records are
// weakly held and disappear with the authenticated guest object.
export function createReplyBudget({now=Date.now,burst=8,interval=400}={}){
 const rows=new WeakMap();
 return function reply(player,send){
  const at=now(),r=rows.get(player)||{at,tokens:burst};
  r.tokens=Math.min(burst,r.tokens+Math.max(0,at-r.at)/interval);r.at=at;rows.set(player,r);
  if(r.tokens<1)return false;
  r.tokens--;send();return true;
 };
}
