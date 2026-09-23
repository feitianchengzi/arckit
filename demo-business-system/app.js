// ArcOrbit 项目管理系统 - 主应用逻辑

class ArcOrbitApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.init();
  }

  init() {
    this.bindNavigation();
    this.updatePageTitle();
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // 更新页面显示
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');

    // 更新标题
    this.currentPage = page;
    this.updatePageTitle();
  }

  updatePageTitle() {
    const titles = {
      dashboard: '仪表盘',
      projects: '项目',
      tasks: '任务',
      team: '团队'
    };
    document.getElementById('currentPageTitle').textContent = titles[this.currentPage];
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.arcOrbitApp = new ArcOrbitApp();
});
