document.addEventListener("DOMContentLoaded", () => {
  const data = window.CBQRC_DATA || {};
  const NEWS_PAGE_SIZE = 6;
  const ui = {
    newsImagePlaceholder: "CBQRC 소식",
    mediaImagePlaceholder: "미디어 자료",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    readMore: "자세히 보기",
    newTabSuffix: "새 탭 열림",
    originalArticle: "원문",
    featuredStoryLabel: "대표 기사",
    featuredMediaLabel: "대표 영상",
    thumbnailSuffix: "썸네일",
    memberAreasHeading: "주요 분야",
    memberDetailsHeading: "추가 정보",
    memberLinksHeading: "링크",
    memberPhotoAltSuffix: "사진",
    historyGroupLabel: "연혁",
    historyLinkLabel: "관련 자료 보기",
    newsEmpty: "현재 해당 분류의 등록된 소식이 없습니다.",
    mediaEmpty: "현재 해당 분류의 등록된 미디어가 없습니다.",
    ...window.CBQRC_UI
  };
  const bodyPage = document.body.dataset.page;
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = Array.from(document.querySelectorAll("[data-page-link]"));
  let currentNewsPage = 1;
  function normalizeDateValue(value) {
    return Number(String(value).replaceAll(".", ""));
  }

  function toDateTimeValue(value) {
    return String(value).replaceAll(".", "-");
  }

  function formatArchiveCount(count, englishLabels = { singular: "item", plural: "items" }) {
    return document.documentElement.lang === "en"
      ? `All: ${count} ${count === 1 ? englishLabels.singular : englishLabels.plural}`
      : `전체 ${count}건`;
  }

  function getNewsPaginationLabels() {
    return document.documentElement.lang === "en"
      ? { previous: "Previous", next: "Next" }
      : { previous: "이전", next: "다음" };
  }

  function createNewsThumbMarkup(item, extraClass = "") {
    const fallbackMarkup = `
      <span class="news-card__fallback" aria-hidden="true">
        <span class="news-card__placeholder-mark">CBQRC</span>
        <span>${item.category}</span>
      </span>
    `;
    const thumbClass = extraClass ? `news-card__thumb ${extraClass}` : "news-card__thumb";

    return item.imageSrc
      ? `
        <div class="${thumbClass} news-card__thumb--image">
          <img
            class="news-card__thumb-image"
            src="${item.imageSrc}"
            alt="${item.imageAlt || item.title}"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          >
          ${fallbackMarkup}
        </div>
      `
      : `
        <div class="${thumbClass} news-card__thumb--placeholder" aria-hidden="true">
          ${fallbackMarkup}
        </div>
      `;
  }

  function createNewsMetaMarkup(item, className = "news-card__meta") {
    return `
      <div class="${className}">
        <span class="news-card__category">${item.category}</span>
        <time datetime="${toDateTimeValue(item.date)}">${item.date}</time>
      </div>
    `;
  }

  function createNewsLinkMarkup(item, className = "news-card__link") {
    const linkLabel = item.linkLabel || ui.readMore;

    return `
      <a
        class="${className}"
        href="${item.source}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${item.title} ${ui.originalArticle} ${linkLabel}, ${ui.newTabSuffix}"
      >
        ${linkLabel}
      </a>
    `;
  }

  function getYouTubeVideoId(value) {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value, window.location.href);
      const hostname = url.hostname.replace(/^www\./, "");

      if (hostname === "youtu.be") {
        return url.pathname.split("/").filter(Boolean)[0] || null;
      }

      if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtube-nocookie.com") {
        const queryId = url.searchParams.get("v");
        if (queryId) {
          return queryId;
        }

        const segments = url.pathname.split("/").filter(Boolean);
        const markerIndex = segments.findIndex((segment) => ["embed", "shorts", "live"].includes(segment));
        if (markerIndex !== -1 && segments[markerIndex + 1]) {
          return segments[markerIndex + 1];
        }
      }
    } catch (_error) {
      return null;
    }

    return null;
  }

  function getMediaThumbnail(item) {
    if (item.thumbnailSrc) {
      return {
        src: item.thumbnailSrc,
        fallbackSrcSet: item.thumbnailFallbackSrcSet || "",
        alt: item.thumbnailAlt || item.title
      };
    }

    const videoId = getYouTubeVideoId(item.link);
    if (!videoId) {
      return null;
    }

    return {
      src: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      fallbackSrcSet: [
        `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      ].join("|"),
      alt: item.thumbnailAlt || `${item.title} ${ui.thumbnailSuffix}`
    };
  }

  function createCardIcon(item) {
    return "";
  }

  function createNewsCard(item) {
    return `
      <article class="news-card">
        ${createNewsThumbMarkup(item)}
        ${createNewsMetaMarkup(item)}
        <div class="news-card__body">
          <h3>${item.title}</h3>
        </div>
        ${createNewsLinkMarkup(item)}
      </article>
    `;
  }

  function createFeaturedNewsCard(item) {
    return `
      <article class="news-featured-card">
        <div class="news-featured-card__media">
          ${createNewsThumbMarkup(item, "news-featured-card__thumb")}
        </div>
        <div class="news-featured-card__body">
          <span class="eyebrow news-featured-card__eyebrow">${ui.featuredStoryLabel}</span>
          ${createNewsMetaMarkup(item, "news-featured-card__meta")}
          <div class="news-featured-card__copy">
            <h3>${item.title}</h3>
          </div>
          ${createNewsLinkMarkup(item, "button button--secondary news-featured-card__link")}
        </div>
      </article>
    `;
  }

  function createMediaThumbMarkup(item, extraClass = "") {
    const thumbnail = getMediaThumbnail(item);
    const fallbackMarkup = `
      <span class="media-card__fallback" aria-hidden="true">
        <img src="assets/brand/CBQRC_logo_symbol_black.png" alt="">
        <span>${ui.mediaImagePlaceholder}</span>
      </span>
    `;
    const thumbClass = extraClass ? `media-card__thumb ${extraClass}` : "media-card__thumb";

    return thumbnail
      ? `
        <div class="${thumbClass} media-card__thumb--image">
          <img
            class="media-card__thumb-image"
            src="${thumbnail.src}"
            alt="${thumbnail.alt}"
            ${thumbnail.fallbackSrcSet ? `data-fallback-src-set="${thumbnail.fallbackSrcSet}"` : ""}
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          >
          ${fallbackMarkup}
        </div>
      `
      : `
        <div class="${thumbClass} media-card__thumb--placeholder" aria-hidden="true">
          ${fallbackMarkup}
        </div>
      `;
  }

  function createMediaMetaMarkup(item, className = "media-card__meta") {
    return `
      <div class="${className}">
        <span class="media-card__category">${item.category}</span>
        <time datetime="${toDateTimeValue(item.date)}">${item.date}</time>
      </div>
    `;
  }

  function createMediaLinkMarkup(item, className = "media-card__link") {
    const label = item.buttonLabel || ui.readMore;

    return `
      <a
        class="${className}"
        href="${item.link}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${item.title} ${label}, ${ui.newTabSuffix}"
      >
        ${label}
      </a>
    `;
  }

  function createMediaCard(item) {
    return `
      <article class="media-card">
        ${createMediaThumbMarkup(item)}
        ${createMediaMetaMarkup(item)}
        <div class="media-card__body">
          <h3>${item.title}</h3>
        </div>
        ${createMediaLinkMarkup(item)}
      </article>
    `;
  }

  function createFeaturedMediaCard(item) {
    return `
      <article class="media-featured-card">
        <div class="media-featured-card__media">
          ${createMediaThumbMarkup(item, "media-featured-card__thumb")}
        </div>
        <div class="media-featured-card__body">
          <span class="eyebrow media-featured-card__eyebrow">${ui.featuredMediaLabel}</span>
          ${createMediaMetaMarkup(item, "media-featured-card__meta")}
          <div class="media-featured-card__copy">
            <h3>${item.title}</h3>
          </div>
          ${createMediaLinkMarkup(item, "button button--secondary media-featured-card__link")}
        </div>
      </article>
    `;
  }

  function createMediaRailCard(item) {
    return `
      <article class="media-rail-card">
        <div class="media-rail-card__media">
          ${createMediaThumbMarkup(item, "media-rail-card__thumb")}
        </div>
        <div class="media-rail-card__body">
          ${createMediaMetaMarkup(item, "media-rail-card__meta")}
          <div class="media-rail-card__copy">
            <h3>${item.title}</h3>
          </div>
          ${createMediaLinkMarkup(item, "media-rail-card__link")}
        </div>
      </article>
    `;
  }

  function createNewsRailCard(item) {
    return `
      <article class="news-rail-card">
        <div class="news-rail-card__media">
          ${createNewsThumbMarkup(item, "news-rail-card__thumb")}
        </div>
        <div class="news-rail-card__body">
          ${createNewsMetaMarkup(item, "news-rail-card__meta")}
          <div class="news-rail-card__copy">
            <h3>${item.title}</h3>
          </div>
          ${createNewsLinkMarkup(item, "news-rail-card__link")}
        </div>
      </article>
    `;
  }

  function createCooperationCard(item, index) {
    return `
      <article class="cooperation-card cooperation-card--feature${index === 0 ? " cooperation-card--highlight" : ""}">
        <div class="cooperation-card__head">
          <span class="cooperation-card__index">${String(index + 1).padStart(2, "0")}</span>
          ${createCardIcon(item)}
        </div>
        <div class="cooperation-card__content">
          ${item.tag ? `<span class="cooperation-card__tag">${item.tag}</span>` : ""}
          <h3>${item.title}</h3>
          ${item.description ? `<p>${item.description}</p>` : ""}
        </div>
      </article>
    `;
  }

  function renderHomeRoles() {
    const root = document.getElementById("home-role-grid");
    if (!root || !Array.isArray(data.homeRoleData)) {
      return;
    }

    root.innerHTML = data.homeRoleData.map((item, index) => `
      <article class="home-role-card home-role-card--feature">
        <div class="home-role-card__head">
          <span class="home-role-card__index">${String(index + 1).padStart(2, "0")}</span>
          ${createCardIcon(item)}
        </div>
        <div class="home-role-card__content">
          <h3>${item.title}</h3>
          ${item.description ? `<p>${item.description}</p>` : ""}
        </div>
      </article>
    `).join("");
  }

  function renderInfraActivities() {
    const root = document.getElementById("home-infra-grid");
    if (!root || !Array.isArray(data.infraActivities)) {
      return;
    }

    root.innerHTML = data.infraActivities.map((item, index) => `
      <article class="activity-card activity-card--feature${index === 0 ? " activity-card--highlight" : ""}">
        <div class="activity-card__head">
          <span class="activity-card__index">${String(index + 1).padStart(2, "0")}</span>
          ${createCardIcon(item)}
        </div>
        <div class="activity-card__content">
          <h3>${item.title}</h3>
          ${item.description ? `<p>${item.description}</p>` : ""}
        </div>
      </article>
    `).join("");
  }

  function renderEducationCooperation() {
    const root = document.getElementById("home-cooperation-grid");
    if (!root || !Array.isArray(data.educationCooperation)) {
      return;
    }

    root.innerHTML = data.educationCooperation.map((item, index) => createCooperationCard(item, index)).join("");
  }

  function closeMenu() {
    if (!navToggle || !siteNav) {
      return;
    }
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", ui.openMenu);
    siteNav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  }

  function setupNavigation() {
    navLinks.forEach((link) => {
      if (link.dataset.pageLink === bodyPage) {
        link.setAttribute("aria-current", "page");
      }
      link.addEventListener("click", () => {
        if (window.innerWidth <= 860) {
          closeMenu();
        }
      });
    });

    if (!navToggle || !siteNav) {
      return;
    }

    navToggle.addEventListener("click", () => {
      const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isExpanded));
      navToggle.setAttribute("aria-label", isExpanded ? ui.openMenu : ui.closeMenu);
      siteNav.classList.toggle("is-open", !isExpanded);
      document.body.classList.toggle("nav-open", !isExpanded);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        closeMenu();
      }
    });
  }

  function renderCenterRoles() {
    const root = document.getElementById("role-grid");
    if (!root || !Array.isArray(data.centerRoleData)) {
      return;
    }

    root.innerHTML = data.centerRoleData.map((item, index) => `
      <article class="role-card role-card--feature">
        <div class="role-card__index">
          <span class="role-card__number">${String(index + 1).padStart(2, "0")}</span>
          ${createCardIcon(item)}
        </div>
        <div class="role-card__content">
          <span class="role-card__label">${item.label}</span>
          <h3>${item.title}</h3>
        </div>
      </article>
    `).join("");
  }

  function renderDetailCards() {
    const root = document.getElementById("detail-grid");
    if (!root || !Array.isArray(data.detailCardData)) {
      return;
    }

    root.innerHTML = data.detailCardData.map((item, index) => `
      <article class="detail-card detail-card--feature${index === 0 || index === 3 ? " detail-card--wide" : ""}">
        <div class="detail-card__head">
          <span class="detail-card__tag">${item.tag}</span>
          <span class="detail-card__number">${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="detail-card__body">
          ${createCardIcon(item)}
          <div class="detail-card__copy">
            <h3>${item.title}</h3>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderAboutKeywords() {
    const root = document.getElementById("about-keywords");
    if (!root || !Array.isArray(data.aboutKeywords)) {
      return;
    }

    root.innerHTML = data.aboutKeywords.map((keyword) => `<li>${keyword}</li>`).join("");
  }

  function renderCenterStrategies() {
    const root = document.getElementById("center-strategy-grid");
    if (!root || !Array.isArray(data.centerStrategyData)) {
      return;
    }

    root.innerHTML = data.centerStrategyData.map((item) => `
      <article class="strategy-card strategy-card--roadmap">
        <div class="strategy-card__marker" aria-hidden="true">
          <span class="strategy-card__dot"></span>
          <span class="strategy-card__number">${item.number}</span>
        </div>
        <div class="strategy-card__copy">
          <h3>${item.title}</h3>
        </div>
      </article>
    `).join("");
  }

  function renderCenterPartners() {
    const root = document.getElementById("center-partner-grid");
    if (!root || !Array.isArray(data.centerPartnerGroups)) {
      return;
    }

    root.innerHTML = data.centerPartnerGroups.map((item, index) => `
      <li class="partner-card partner-card--ecosystem">
        <span class="partner-card__index">${String(index + 1).padStart(2, "0")}</span>
        <strong class="partner-card__label">${item}</strong>
      </li>
    `).join("");
  }

  function renderMembers() {
    const root = document.getElementById("member-grid");
    if (!root || !Array.isArray(data.memberData)) {
      return;
    }

    const renderTextValue = (value, className = "member-profile__text") => {
      if (Array.isArray(value)) {
        return `
          <ul class="member-profile__list">
            ${value.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        `;
      }

      return `<p class="${className}">${value}</p>`;
    };

    const renderProfileSection = (heading, value, extraClass = "", extraMarkup = "") => {
      if (!value || (Array.isArray(value) && !value.length)) {
        return "";
      }

      const className = extraClass ? `member-profile__section ${extraClass}` : "member-profile__section";
      return `
        <section class="${className}">
          <h4>${heading}</h4>
          ${renderTextValue(value)}
          ${extraMarkup}
        </section>
      `;
    };

    const isKeywordDetail = (detail) => /키워드|Keyword/i.test(detail.label || "");
    const isLabDetail = (detail) => /연구실|Lab/i.test(detail.label || "");
    const isCareerDetail = (detail) => /이력|position/i.test(detail.label || "");

    const renderKeywordBlock = (detail) => {
      if (!detail || !detail.value) {
        return "";
      }

      const keywords = Array.isArray(detail.value)
        ? detail.value
        : String(detail.value).split(",").map((item) => item.trim()).filter(Boolean);

      if (!keywords.length) {
        return "";
      }

      return `
        <section class="member-profile__keywords">
          <h4>${detail.label}</h4>
          <ul class="member-profile__keyword-list">
            ${keywords.map((keyword) => `<li class="member-profile__keyword">${keyword}</li>`).join("")}
          </ul>
        </section>
      `;
    };

    const renderLinkBlock = (links) => {
      if (!links || !links.length) {
        return "";
      }

      return `
        <div class="member-profile__links" aria-label="${ui.memberLinksHeading}">
          ${links.map((link) => `
            <a
              class="button button--secondary member-profile__link"
              href="${link.href}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="${link.label}, ${ui.newTabSuffix}"
            >
              ${link.label}
            </a>
          `).join("")}
        </div>
      `;
    };

    root.innerHTML = data.memberData.map((member) => {
      const details = Array.isArray(member.details) ? member.details : [];
      const keywordDetail = details.find(isKeywordDetail);
      const orderedDetails = [
        ...details.filter((detail) => isCareerDetail(detail)),
        ...details.filter((detail) => isLabDetail(detail)),
        ...details.filter((detail) => !isKeywordDetail(detail) && !isCareerDetail(detail) && !isLabDetail(detail))
      ];

      return `
        <article class="member-card member-card--profile${member.featured ? " member-card--featured" : ""}">
          <div class="member-profile__photo" aria-label="${member.name} ${ui.memberPhotoAltSuffix}">
            ${member.photoSrc
              ? `<img class="member-profile__photo-image" src="${member.photoSrc}" alt="${member.photoAlt || `${member.name} ${ui.memberPhotoAltSuffix}`}" loading="lazy">`
              : `<span class="member-profile__avatar" aria-hidden="true">${member.photoLabel || member.name.slice(0, 2)}</span>`}
            ${member.photoNote ? `<span class="member-profile__photo-note">${member.photoNote}</span>` : ""}
          </div>
          <div class="member-profile__overview">
            <span class="eyebrow member-profile__eyebrow">${member.badge}</span>
            <h3>${member.name}</h3>
            <p class="member-profile__title">${member.title}</p>
            ${member.description ? `<p class="member-profile__summary">${member.description}</p>` : ""}
            ${renderKeywordBlock(keywordDetail)}
          </div>
          <div class="member-profile__details">
            ${renderProfileSection(ui.memberAreasHeading, member.fields, "member-profile__section--areas")}
            ${orderedDetails.map((detail) => renderProfileSection(
              detail.label,
              detail.value,
              isLabDetail(detail)
                ? "member-profile__section--lab"
                : isCareerDetail(detail)
                  ? "member-profile__section--career"
                  : "",
              isLabDetail(detail) ? renderLinkBlock(member.links) : ""
            )).join("")}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderTimeline() {
    const root = document.getElementById("timeline");
    const resultCount = document.getElementById("history-result-count");
    if (!root || !Array.isArray(data.historyItems)) {
      return;
    }

    if (resultCount) {
      resultCount.textContent = formatArchiveCount(data.historyItems.length);
    }

    if (!data.historyItems.length) {
      return;
    }

    const getHistoryDateParts = (value) => {
      const parts = String(value || "").split(".");
      const year = parts[0] || "";
      const month = parts[1] || "";
      const day = parts[2] || "";
      const display = day ? `${month}.${day}` : (month || year);

      return {
        year,
        display
      };
    };

    const sortedItems = [...data.historyItems].sort((a, b) => (
      toDateTimeValue(b.date).localeCompare(toDateTimeValue(a.date))
    ));
    const groups = sortedItems.reduce((acc, item) => {
      const year = getHistoryDateParts(item.date).year;
      const current = acc[acc.length - 1];
      if (!current || current.year !== year) {
        acc.push({ year, items: [item] });
      } else {
        current.items.push(item);
      }
      return acc;
    }, []);

    const items = groups.map((group, groupIndex) => {
      const sideClass = groupIndex % 2 === 0
        ? "history-year-block--events-right"
        : "history-year-block--events-left";

      return `
        <li class="history-year-block ${sideClass}">
          <div class="history-year-block__year" aria-hidden="true">${group.year}</div>
          <div class="history-year-block__axis"><span></span></div>
          <ol class="history-year-block__events" aria-label="${group.year} ${ui.historyGroupLabel}">
            ${group.items.map((item) => {
              const dateParts = getHistoryDateParts(item.date);
              const linkMarkup = item.url
                ? `
                  <a
                    class="history-timeline__link"
                    href="${item.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="${item.title} ${ui.historyLinkLabel}, ${ui.newTabSuffix}"
                  >
                    ${ui.historyLinkLabel}
                  </a>
                `
                : "";

              return `
                <li class="history-event">
                  <div class="history-event__date">
                    <time datetime="${toDateTimeValue(item.date)}">${dateParts.display}</time>
                  </div>
                  <div class="history-event__body">
                    <div class="history-timeline__meta">
                      <span>${item.category}</span>
                    </div>
                    <h3>${item.title}</h3>
                    ${linkMarkup}
                  </div>
                </li>
              `;
            }).join("")}
          </ol>
        </li>
      `;
    }).join("");

    root.innerHTML = items;
  }

  function renderHomeNews() {
    const root = document.getElementById("home-news-grid");
    const featured = document.getElementById("home-news-featured");
    if (!root || !featured || !Array.isArray(data.newsData)) {
      return;
    }

    const sorted = [...data.newsData].sort((left, right) => normalizeDateValue(right.date) - normalizeDateValue(left.date));
    if (!sorted.length) {
      featured.innerHTML = `<div class="news-empty" role="status">${ui.newsEmpty}</div>`;
      root.innerHTML = "";
      return;
    }

    featured.innerHTML = "";
    root.innerHTML = sorted.slice(0, 3).map((item) => createNewsCard(item)).join("");
  }

  function renderHomeMedia() {
    const root = document.getElementById("home-media-grid");
    const featured = document.getElementById("home-media-featured");
    if (!root || !featured || !Array.isArray(data.mediaData)) {
      return;
    }

    const sorted = [...data.mediaData].sort((left, right) => normalizeDateValue(right.date) - normalizeDateValue(left.date));
    if (!sorted.length) {
      featured.innerHTML = `<div class="news-empty" role="status">${ui.mediaEmpty}</div>`;
      root.innerHTML = "";
      return;
    }

    featured.innerHTML = "";
    root.innerHTML = sorted.slice(0, 3).map((item) => createMediaCard(item)).join("");
  }

  function renderHomeDirector() {
    const root = document.getElementById("home-director-card");
    if (!root || !Array.isArray(data.memberData)) {
      return;
    }

    const director = data.memberData.find((member) => member.featured) || data.memberData[0];
    if (!director) {
      return;
    }

    const keywordDetail = Array.isArray(director.details)
      ? director.details.find((detail) => /키워드|keyword/i.test(detail.label || ""))
      : null;
    const keywords = keywordDetail
      ? (Array.isArray(keywordDetail.value)
        ? keywordDetail.value
        : String(keywordDetail.value).split(",").map((keyword) => keyword.trim()).filter(Boolean))
      : [];

    root.innerHTML = `
      <article class="home-director-card home-director-card--feature">
        <div class="home-director-card__visual">
          <div class="home-director-card__photo" aria-label="${director.name} ${ui.memberPhotoAltSuffix}">
            ${director.photoSrc
              ? `<img src="${director.photoSrc}" alt="${director.photoAlt || `${director.name} ${ui.memberPhotoAltSuffix}`}" loading="lazy">`
              : `<span aria-hidden="true">${director.photoLabel || director.name.slice(0, 2)}</span>`}
          </div>
        </div>
        <div class="home-director-card__main">
          <div class="home-director-card__content">
            <span class="home-director-card__badge">${director.badge}</span>
            <h3>${director.name}</h3>
            <p class="home-director-card__title">${director.title}</p>
            ${director.description ? `<p class="home-director-card__summary">${director.description}</p>` : ""}
          </div>
          ${keywords.length
            ? `
              <section class="home-director-card__section home-director-card__section--keywords">
                <h4>${keywordDetail.label}</h4>
                <div class="home-director-card__fields">${keywords.map((keyword) => `<span>${keyword}</span>`).join("")}</div>
              </section>
            `
            : ""}
        </div>
      </article>
    `;
  }

  function renderNewsArchive() {
    const grid = document.getElementById("news-grid");
    const featured = document.getElementById("news-featured");
    const subhead = document.getElementById("news-archive-subhead");
    const pagination = document.getElementById("news-pagination");
    const resultCount = document.getElementById("news-result-count");
    if (!grid || !Array.isArray(data.newsData)) {
      return;
    }

    const sorted = [...data.newsData].sort((left, right) => normalizeDateValue(right.date) - normalizeDateValue(left.date));

    if (resultCount) {
      resultCount.textContent = formatArchiveCount(sorted.length, { singular: "story", plural: "stories" });
    }

    if (!featured) {
      grid.innerHTML = sorted.length
        ? sorted.map((item) => createNewsCard(item)).join("")
        : `<div class="news-empty" role="status">${ui.newsEmpty}</div>`;
      if (pagination) {
        pagination.hidden = true;
        pagination.innerHTML = "";
      }
      return;
    }

    if (!sorted.length) {
      featured.innerHTML = `<div class="news-empty" role="status">${ui.newsEmpty}</div>`;
      grid.innerHTML = "";
      grid.hidden = true;
      if (pagination) {
        pagination.hidden = true;
        pagination.innerHTML = "";
      }
      if (subhead) {
        subhead.hidden = true;
      }
      return;
    }

    const [featuredItem, ...archiveItems] = sorted;
    const totalPages = Math.max(1, Math.ceil(archiveItems.length / NEWS_PAGE_SIZE));
    currentNewsPage = Math.min(currentNewsPage, totalPages);

    const renderNewsPage = () => {
      const startIndex = (currentNewsPage - 1) * NEWS_PAGE_SIZE;
      const visibleItems = archiveItems.slice(startIndex, startIndex + NEWS_PAGE_SIZE);
      const labels = getNewsPaginationLabels();

      grid.innerHTML = visibleItems.map((item) => createNewsCard(item)).join("");

      if (!pagination) {
        return;
      }

      if (totalPages <= 1) {
        pagination.hidden = true;
        pagination.innerHTML = "";
        return;
      }

      pagination.hidden = false;
      pagination.innerHTML = `
        <button
          class="news-pagination__button"
          type="button"
          data-news-page="${currentNewsPage - 1}"
          ${currentNewsPage === 1 ? "disabled" : ""}
        >
          ${labels.previous}
        </button>
        <div class="news-pagination__pages">
          ${Array.from({ length: totalPages }, (_unused, index) => {
            const page = index + 1;
            return `
              <button
                class="news-pagination__button${page === currentNewsPage ? " is-active" : ""}"
                type="button"
                data-news-page="${page}"
                ${page === currentNewsPage ? 'aria-current="page"' : ""}
              >
                ${page}
              </button>
            `;
          }).join("")}
        </div>
        <button
          class="news-pagination__button"
          type="button"
          data-news-page="${currentNewsPage + 1}"
          ${currentNewsPage === totalPages ? "disabled" : ""}
        >
          ${labels.next}
        </button>
      `;

      pagination.querySelectorAll("[data-news-page]").forEach((button) => {
        button.addEventListener("click", () => {
          const nextPage = Number(button.getAttribute("data-news-page"));
          if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === currentNewsPage) {
            return;
          }

          currentNewsPage = nextPage;
          renderNewsPage();
        });
      });
    };

    featured.innerHTML = createFeaturedNewsCard(featuredItem);
    grid.hidden = archiveItems.length === 0;
    if (subhead) {
      subhead.hidden = archiveItems.length === 0;
    }
    if (pagination) {
      pagination.hidden = archiveItems.length <= NEWS_PAGE_SIZE;
    }
    renderNewsPage();
  }

  function renderMediaArchive() {
    const grid = document.getElementById("media-grid");
    const featured = document.getElementById("media-featured");
    const rail = document.getElementById("media-rail");
    const subhead = document.getElementById("media-archive-subhead");
    const resultCount = document.getElementById("media-result-count");
    if (!grid || !Array.isArray(data.mediaData)) {
      return;
    }

    const sorted = [...data.mediaData].sort((left, right) => normalizeDateValue(right.date) - normalizeDateValue(left.date));

    if (resultCount) {
      resultCount.textContent = formatArchiveCount(sorted.length);
    }

    if (!featured || !rail) {
      grid.innerHTML = sorted.length
        ? sorted.map((item) => createMediaCard(item)).join("")
        : `<div class="news-empty" role="status">${ui.mediaEmpty}</div>`;
      return;
    }

    if (!sorted.length) {
      featured.innerHTML = `<div class="news-empty" role="status">${ui.mediaEmpty}</div>`;
      rail.innerHTML = "";
      rail.hidden = true;
      grid.innerHTML = "";
      grid.hidden = true;
      if (subhead) {
        subhead.hidden = true;
      }
      return;
    }

    const [featuredItem, ...archiveItems] = sorted;

    featured.innerHTML = createFeaturedMediaCard(featuredItem);
    rail.hidden = true;
    rail.innerHTML = "";
    grid.hidden = archiveItems.length === 0;
    if (subhead) {
      subhead.hidden = archiveItems.length === 0;
    }
    grid.innerHTML = archiveItems.map((item) => createMediaCard(item)).join("");
  }

  function setupCardImageFallbacks() {
    function applyNextImageFallback(image) {
      const fallbackSrcSet = image.dataset.fallbackSrcSet;
      if (!fallbackSrcSet) {
        return false;
      }

      const [nextSrc, ...remaining] = fallbackSrcSet.split("|").filter(Boolean);
      if (!nextSrc || image.currentSrc === nextSrc || image.src === nextSrc) {
        image.removeAttribute("data-fallback-src-set");
        return false;
      }

      if (remaining.length > 0) {
        image.dataset.fallbackSrcSet = remaining.join("|");
      } else {
        image.removeAttribute("data-fallback-src-set");
      }

      image.src = nextSrc;
      return true;
    }

    document.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      const thumb = image.closest(".news-card__thumb--image, .media-card__thumb--image");
      if (!thumb) {
        return;
      }

      if (applyNextImageFallback(image)) {
        return;
      }

      thumb.classList.add("is-fallback");
      image.setAttribute("aria-hidden", "true");
    }, true);
  }

  setupNavigation();
  renderHomeRoles();
  renderInfraActivities();
  renderEducationCooperation();
  renderCenterRoles();
  renderDetailCards();
  renderAboutKeywords();
  renderCenterStrategies();
  renderCenterPartners();
  renderMembers();
  renderTimeline();
  renderHomeNews();
  renderHomeMedia();
  renderHomeDirector();
  renderNewsArchive();
  renderMediaArchive();
  setupCardImageFallbacks();
});
