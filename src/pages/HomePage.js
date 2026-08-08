const ICONS = {
  home: "assets/icons/icon-home.png",
  record: "assets/icons/icon-record.png",
  review: "assets/icons/icon-review.png",
  feedback: "assets/icons/icon-heart.png",
  cup: "assets/icons/icon-cup.png",
  lock: "assets/icons/icon-lock.png",
  heart: "assets/icons/icon-heart.png",
};

const NICKNAME_STORAGE_KEY = "nuanwo_nickname";

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getNickname() {
  return localStorage.getItem(NICKNAME_STORAGE_KEY) ?? "";
}

function setNickname(name) {
  localStorage.setItem(NICKNAME_STORAGE_KEY, name);
  window.USER_NICKNAME = name;
}

function formatTodayLabel() {
  const today = new Date();
  return `${today.getMonth() + 1}月${today.getDate()}日`;
}

export function HomePage({ navigateTo }) {
  const page = document.createElement("main");
  page.className = "page home-page";
  window.USER_NICKNAME = getNickname();

  page.innerHTML = `
    <section class="home-hero-banner" aria-labelledby="home-title">
      <img class="home-hero-icon pixel-icon pixel-icon-lg" src="${ICONS.home}" alt="" aria-hidden="true" />
      <h1 id="home-title">暖窝</h1>
      <div class="nickname-area" data-nickname-area></div>
    </section>
    <div class="home-cards">
      <article class="today-card" aria-label="今日状态">
        <div class="today-card-icon" aria-hidden="true"><img class="pixel-icon" src="${ICONS.heart}" alt="" /></div>
        <div class="today-card-body">
          <div class="today-card-heading today-card-heading-date-only"><time>${formatTodayLabel()}</time></div>
          <p class="today-card-mood">把想说的话放在这里</p>
          <button class="today-card-action" type="button" data-record-entry><span>点击记录</span><span aria-hidden="true">→</span></button>
        </div>
      </article>
      <div class="home-cards-row">
        <button class="home-tile" type="button" data-dashboard-entry><h3>7 天回顾</h3><p>看看情绪的变化和反复出现的主题。</p><img class="home-tile-glyph pixel-icon" src="${ICONS.review}" alt="" aria-hidden="true" /></button>
        <button class="home-tile" type="button" data-happy-entry><h3>开心 moment</h3><p>收集生活里值得被记住的小确幸。</p><img class="home-tile-glyph pixel-icon" src="${ICONS.cup}" alt="" aria-hidden="true" /></button>
      </div>
      <button class="home-privacy-row" type="button" data-privacy-row><img class="pixel-icon pixel-icon-sm" src="${ICONS.lock}" alt="" aria-hidden="true" /><span>隐私与安全</span><span aria-hidden="true">查看 →</span></button>
    </div>
    <nav class="quick-entry-bar" aria-label="底部导航">
      <button class="quick-entry is-active" type="button" data-home-entry><img class="quick-entry-icon pixel-icon" src="${ICONS.home}" alt="" aria-hidden="true" /><span>首页</span></button>
      <button class="quick-entry" type="button" data-quick-record><img class="quick-entry-icon pixel-icon" src="${ICONS.record}" alt="" aria-hidden="true" /><span>记录</span></button>
      <button class="quick-entry" type="button" data-quick-dashboard><img class="quick-entry-icon pixel-icon" src="${ICONS.review}" alt="" aria-hidden="true" /><span>回顾</span></button>
      <button class="quick-entry" type="button" data-quick-feedback><img class="quick-entry-icon pixel-icon" src="${ICONS.feedback}" alt="" aria-hidden="true" /><span>反馈</span></button>
    </nav>
    <div class="privacy-modal" id="privacyModal" hidden>
      <div class="privacy-modal-overlay" data-privacy-overlay></div>
      <div class="privacy-modal-content" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <div class="privacy-modal-header"><h2 id="privacy-title">隐私与安全</h2><button class="privacy-modal-close" type="button" data-privacy-close aria-label="关闭">×</button></div>
        <div class="privacy-modal-body">
          <p><strong>隐私与安全提示（匿名设备标识·专属服务版）</strong></p>
          <p>更新日期：2026年8月1日<br />生效日期：2026年8月1日</p>
          <p>我们深知隐私的重要性。本 App 无需注册或登录，不收集您的手机号、邮箱或其他现实身份信息。产品目前不涉及用户社交、语音、视频、拍照、相册上传或文件上传功能。</p>

          <h3>一、我们如何收集和使用您的信息</h3>
          <p><strong>1. 自动生成的匿名标识（UUID）</strong><br />为区分设备并提供连续服务，App 首次启动时会在设备本地生成一个随机 UUID。该 UUID 无法反向识别您的真实身份，也不与手机号或社交账号绑定。清除浏览器或 App 本地数据后，系统会生成新的 UUID。</p>
          <p><strong>2. 您主动提供的必要信息</strong><br />您主动输入的情绪记录、情绪标签、情绪强度、发生场景、开心时刻及昵称（如填写），会用于保存记录、生成 AI 回复、日历记录、情绪统计和周回顾。为生成 AI 回复，必要的记录内容会发送至服务端及 AI 服务提供商处理。</p>
          <p><strong>3. 设备与运行日志</strong><br />为修复 Bug、保障服务稳定和防范恶意请求，服务可能记录基础运行日志、请求时间、错误信息及必要的设备和网络信息。这些信息不会用于建立与您真实身份相关的用户画像。</p>
          <p>除上述功能外，本产品不会申请或使用社交、语音、视频、相机、相册、麦克风或文件存储权限。</p>

          <h3>二、数据如何存储与处理</h3>
          <p><strong>1. 匿名隔离</strong><br />您的记录仅关联随机生成的 UUID，并与其他用户数据隔离。我们不会主动尝试将 UUID 与任何现实身份信息关联。</p>
          <p><strong>2. 本地与服务端分工</strong><br />UUID 和昵称等基础设置保存在您的设备本地；情绪记录及其 AI 分析结果会发送到服务端，用于提供历史记录、日历、统计和周回顾功能。数据保存期限以实际服务配置和删除操作为准。</p>
          <p><strong>3. 必要的服务提供商</strong><br />我们可能使用云托管、数据库和 AI 模型服务来完成存储与回复生成。相关服务商仅在提供本产品功能所需范围内处理数据。我们不会出售、出租或向广告联盟共享您的隐私数据；法律法规或司法机关依法要求时除外。</p>

          <h3>三、数据安全与自动化决策</h3>
          <p><strong>1. 安全防护</strong><br />我们会采取 HTTPS/TLS 传输加密、访问控制和必要的安全管理措施保护数据。任何网络服务都无法保证绝对安全，如发现异常请通过 App 内反馈联系。</p>
          <p><strong>2. AI 结果说明</strong><br />本服务使用算法或 AI 模型生成回复、总结和照顾建议，仅针对您当次输入，不建立系统性用户画像，也不构成医疗、心理或其他专业诊断。您可以停止使用、删除记录或通过反馈提出疑问。</p>
          <p><strong>3. 应急响应</strong><br />如发生影响用户数据安全的事件，我们会依据适用法律法规和实际可用的联系方式采取通知及补救措施。</p>

          <h3>四、您的权利</h3>
          <p><strong>1. 查看与管理</strong><br />您可以在日历页面查看历史记录，并使用页面中的删除按钮删除单条记录。</p>
          <p><strong>2. 删除全部数据与重置标识</strong><br />当前版本暂未提供一键清除服务端全部数据的设置入口。如需删除与当前 UUID 关联的全部历史数据，请通过底部导航栏的“反馈”联系我们。清除浏览器或 App 本地数据只会重置本地 UUID，不会自动删除服务端历史记录。</p>
          <p><strong>3. 撤回同意</strong><br />您可以停止使用本服务、清除本地设置，或通过“反馈”联系我们处理隐私请求。</p>

          <h3>五、提示的变更</h3>
          <p>若本提示发生重大变更，例如处理目的或数据范围发生变化，我们会通过弹窗等方式重新提示，并在必要时征得您的明确同意。</p>
          <p><strong>联系我们：</strong>App 内导航栏 → 反馈</p>
          <div class="privacy-agreement"><label><input type="checkbox" id="privacyAgreement" /><span>我已阅读并同意《用户协议》及《隐私政策》的全部内容。</span></label></div>
        </div>
      </div>
    </div>
  `;

  const nicknameArea = page.querySelector("[data-nickname-area]");

  function bindNicknameSet() {
    const setButton = nicknameArea.querySelector("[data-nickname-set]");
    const input = nicknameArea.querySelector("[data-nickname-input]");
    if (!setButton || !input) return;
    const saveNickname = () => {
      const name = input.value.trim();
      if (name) { setNickname(name); renderNickname(); }
    };
    setButton.addEventListener("click", saveNickname);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); saveNickname(); }
    });
  }

  function renderNickname() {
    const name = getNickname();
    nicknameArea.innerHTML = name
      ? `<p class="nickname-greeting">Hi，<strong>${escapeHtml(name)}</strong> <span>欢迎回来</span></p><button class="nickname-edit-btn" type="button" data-nickname-edit>修改</button>`
      : `<div class="nickname-setup"><input class="nickname-input" type="text" maxlength="12" placeholder="给自己一个称呼吧" data-nickname-input /><button class="nickname-set-btn" type="button" data-nickname-set>确定</button></div>`;
    nicknameArea.querySelector("[data-nickname-edit]")?.addEventListener("click", () => {
      nicknameArea.innerHTML = `<div class="nickname-setup"><input class="nickname-input" type="text" maxlength="12" value="${escapeHtml(name)}" data-nickname-input /><button class="nickname-set-btn" type="button" data-nickname-set>确定</button></div>`;
      const input = nicknameArea.querySelector("[data-nickname-input]"); input.focus(); input.select(); bindNicknameSet();
    });
    bindNicknameSet();
  }

  renderNickname();
  page.querySelector("[data-record-entry]").addEventListener("click", () => navigateTo("/record"));
  page.querySelector("[data-happy-entry]").addEventListener("click", () => navigateTo("/record?mood=happy"));
  page.querySelector("[data-dashboard-entry]").addEventListener("click", () => navigateTo("/dashboard"));
  page.querySelector("[data-home-entry]").addEventListener("click", () => navigateTo("/"));
  page.querySelector("[data-quick-record]").addEventListener("click", () => navigateTo("/record"));
  page.querySelector("[data-quick-dashboard]").addEventListener("click", () => navigateTo("/dashboard"));
  page.querySelector("[data-quick-feedback]").addEventListener("click", () => { window.location.href = "https://wpfeedback.netlify.app/"; });
  const privacyModal = page.querySelector("#privacyModal");
  page.querySelector("[data-privacy-row]").addEventListener("click", () => { privacyModal.hidden = false; });
  page.querySelector("[data-privacy-overlay]").addEventListener("click", () => { privacyModal.hidden = true; });
  page.querySelector("[data-privacy-close]").addEventListener("click", () => { privacyModal.hidden = true; });
  return page;
}
