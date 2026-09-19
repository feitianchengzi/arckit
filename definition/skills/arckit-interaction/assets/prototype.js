// 仅提供可操作骨架；场景切换不会连接业务服务或定义产品规则。
(() => {
  const $ = id => document.getElementById(id);
  let state = 'content';
  function render() {
    $('scenario').value = state;
    $('content').hidden = state !== 'content';
    $('recover').hidden = !['loading', 'empty', 'error'].includes(state);
    $('status').textContent = {
      content: '示例内容，可输入并查看。', loading: '正在加载（由场景工具控制完成）。',
      empty: '暂无内容。', error: '加载失败，可以重试；原输入保留。'
    }[state];
  }
  $('scenario').addEventListener('change', event => { state = event.target.value; render(); });
  $('recover').addEventListener('click', () => { state = 'content'; render(); $('entry').focus(); });
  $('reset').addEventListener('click', () => {
    $('entry-form').reset(); $('result').textContent = ''; state = 'content';
    $('detail-dialog').close(); render();
  });
  $('entry-form').addEventListener('submit', event => {
    event.preventDefault(); $('result').textContent = $('entry').value;
  });
  $('open-dialog').addEventListener('click', () => $('detail-dialog').showModal());
  $('detail-dialog').addEventListener('close', () => $('open-dialog').focus());
  render();
})();
