const bb=require('./bb.cjs');
const lang=process.argv[2]||'pt'; const only=process.argv[3]||'';
const L=t=>bb.L(lang,t);
const BACK={pt:'Voltar',en:'Back',es:'Atrás'}[lang];
const OUTD=(process.env.BB_OUT||'/tmp/bb_final')+'/';require('fs').mkdirSync(OUTD,{recursive:true});
const fs=require('fs');
async function flow(name,fn,opts){
  if(only&&!only.split(',').includes(name))return;
  console.log('==',lang,name);const {b,p}=await bb.open(lang,opts);
  const S=async id=>{await bb.shot(p,'t_'+id);fs.renameSync(bb.OUT+'/t_'+id+'.png',OUTD+id+'-'+lang+'.png');};
  try{await fn(p,S)}catch(e){console.log('  ERR',name,e.message);await bb.shot(p,'err_'+name+'_'+lang)}
  await b.close();
}
(async()=>{
await flow('out',async(p,S)=>{await S('login');await bb.tap(p,L('Criar conta'),{role:'button'});await S('signup');},{q:'&out=1',port:8776});
await flow('idle',async(p,S)=>{await bb.tap(p,L('Depois'),{role:'button'});await S('home');await bb.tap(p,L('Iniciar rolê'));await S('start-outing');},{q:'&idle=1'});
await flow('main',async(p,S)=>{
  await bb.tap(p,L('Continuar rolê'));await S('outing');
  await bb.tap(p,L('Editar orçamento'));await S('budget');await bb.tap(p,L('Cancelar'),{role:'button'});
  await bb.tap(p,L('Bebida'),{role:'button',exact:true});await S('new-order');
  await bb.tap(p,L('Garrafa ou jarra compartilhada'),{role:'button'});await S('shared-bottle');
  await bb.tap(p,BACK,{role:'button'});
  await bb.tap(p,L('Por pessoa'),{role:'button'});await S('by-person');
  await bb.tap(p,L('Pedidos'),{role:'button',exact:true});
  await bb.tap(p,L('Mais uma:'),{role:'button'});await S('repeat');
});
await flow('table',async(p,S)=>{
  await bb.tap(p,L('Continuar rolê'));await bb.scroll(p,500);
  await bb.tapS(p,L('Mesa ilustrada'));await bb.scroll(p,700);await S('table');
  await bb.tapS(p,L('Opções da mesa'),{role:'button',max:775});await bb.tap(p,L('Trocar cenário'));await S('scenario');
});
await flow('bill',async(p,S)=>{
  await bb.tap(p,L('Continuar rolê'));await bb.tap(p,L('Conta'),{role:'button',exact:true});await S('bill');
  await bb.tapS(p,L('Serviço, desconto e itens'));await S('tab');
  await bb.tap(p,BACK,{role:'button'});
  await bb.tapS(p,L('Dividir e registrar pagamentos'));await S('split');
  await bb.tap(p,BACK,{role:'button'});
  await bb.tapS(p,L('Compartilhar divisão'));await S('share-split');
});
await flow('catalog',async(p,S)=>{
  await bb.tap(p,L('Catálogo'),{role:'tab'});await S('catalog');
  await bb.tap(p,L('Detalhes'),{role:'button',exact:true});await S('drink-detail');
  await bb.tapS(p,L('Sobre estes dados'),{max:762});await bb.scroll(p,500,195,400);await S('drink-sources');
});
await flow('custom',async(p,S)=>{
  await bb.tap(p,L('Catálogo'),{role:'tab'});await bb.tapS(p,L('Cadastrar bebida'));await S('custom-drink');
});
await flow('end',async(p,S)=>{
  await bb.tap(p,L('Continuar rolê'));await bb.tap(p,L('Encerrar rolê'),{role:'button',idx:0});await S('end-outing');
  await bb.tap(p,L('Encerrar e ver resumo'));await S('summary');
  await bb.scroll(p,420);await S('summary-table');
  await bb.tap(p,L('Concluir'),{role:'button'});
  await bb.tap(p,L('Histórico'),{role:'tab'});await S('history');
  await bb.tap(p,L('Estatísticas'),{role:'button'});await S('stats');
});
await flow('games',async(p,S)=>{
  await bb.tap(p,L('Resenha'),{role:'tab'});await S('games');
  await bb.tap(p,L('Eu nunca'),{role:'button'});
  await bb.tap(p,L('Pessoas do rolê'),{role:'button'});
  for(const n of [L('Você'),'João','Gleidson','Rodrigo'])await bb.tap(p,n,{role:'checkbox'});
  await bb.tap(p,L('Usar selecionados'),{role:'button'});await S('game-setup');
  await bb.tap(p,L('Começar'),{role:'button'});await S('game-play');
});
await flow('tip',async(p,S)=>{await bb.tap(p,L('Resenha'),{role:'tab'});await bb.tap(p,L('Virar o copo'));await S('tip-glass');});
await flow('bafo',async(p,S)=>{await bb.tap(p,L('Resenha'),{role:'tab'});await bb.tap(p,L('Bafômetro de brincadeira'));await S('bafometro');});
await flow('cards',async(p,S)=>{await bb.tap(p,L('Resenha'),{role:'tab'});await bb.tap(p,L('Minhas cartas'));await S('custom-cards');});
await flow('settings',async(p,S)=>{await bb.tap(p,L('Configurações'),{role:'button'});await S('settings');});
})();
