




// UI Toggles & Constants
// Invoice Data Model
const invoiceData = {
  categories: [
    { id: 'hardware', name: '1. Hardware Package', isPackage: true },
    { id: 'services', name: '2. Professional Services', isPackage: false },
    { id: 'support', name: '3. Additional Support & Configuration', isPackage: false },
    { id: 'software', name: '4. Software Subscription (30-Day Promotional Offer)', isPackage: false }
  ],
  hardware: [],
  hardwarePackagePrice: 0.00,
  services: [],
  support: [],
  software: [],
  deletedCategories: [],
  customTitles: {}
};

// UI Toggles & Constants
let isEditMode = false;
let isDarkTheme = false;
// DOM Elements
const bodyEl = document.body;
const themeToggleBtn = document.getElementById('theme-toggle');
const modeToggleBtn = document.getElementById('mode-toggle');
const printBtn = document.getElementById('print-btn');
const sidebarControls = document.getElementById('sidebar-controls');
const hardwareBody = document.getElementById('hardware-items-body');
const servicesBody = document.getElementById('services-items-body');
const supportBody = document.getElementById('support-items-body');
const softwareBody = document.getElementById('software-items-body');

// Input Controls in Sidebar
const addCategorySel = document.getElementById('add-category');
const addDescInput = document.getElementById('add-desc');
const addSubdescInput = document.getElementById('add-subdesc');
const addQtyInput = document.getElementById('add-qty');
const addPriceInput = document.getElementById('add-price');
const addIsPromoChk = document.getElementById('add-is-promo');
const promoCheckboxContainer = document.getElementById('promo-checkbox-container');

const addItemBtn = document.getElementById('add-item-btn');
const newCategoryNameInput = document.getElementById('new-category-name');
const addCategoryBtn = document.getElementById('add-category-btn');

const sidebarInvoiceNo = document.getElementById('input-invoice-number');
const sidebarInvoiceDate = document.getElementById('input-invoice-date');
const sidebarDueDate = document.getElementById('input-due-date');

// Invoice Meta Values on Sheet
const sheetInvoiceNo = document.getElementById('invoice-no-val');
const sheetInvoiceDate = document.getElementById('invoice-date-val');
const sheetDueDate = document.getElementById('due-date-val');

// Payment Details DOM Elements
const inputShowPayment = document.getElementById('input-show-payment');
const paymentDetailsInputs = document.getElementById('payment-details-inputs');
const inputPaymentWire = document.getElementById('input-payment-wire');
const inputPaymentOnline = document.getElementById('input-payment-online');

const paymentMethodsBox = document.getElementById('payment-methods-box');
const paymentWireText = document.getElementById('payment-wire-text');
const paymentOnlineText = document.getElementById('payment-online-text');

// Version Control DOM Elements
const saveVersionBtn = document.getElementById('save-version-btn');
const versionsList = document.getElementById('versions-list');
const noVersionsText = document.getElementById('no-versions-text');

// Dialog / Settings Hub Selectors
const settingsDialog = document.getElementById('settings-dialog');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveCloseSettingsBtn = document.getElementById('save-close-settings-btn');

// Drafts Hub Selectors
const draftsHubDialog = document.getElementById('drafts-hub-dialog');
const draftsHubBtn = document.getElementById('drafts-hub-btn');
const closeDraftsHubBtn = document.getElementById('close-drafts-hub-btn');
const draftsSearchInput = document.getElementById('drafts-search-input');

// Editable sheet containers to save/load details
const companyDetailsContainer = document.querySelector('.company-details');
const clientDetailsContainer = document.querySelector('.client-details');
const statusBadge = document.querySelector('.status-badge');

// Status Badge Elements
const inputShowStatus = document.getElementById('input-show-status');
const statusBadgeBox = document.getElementById('status-badge-box');

// Totals Display Elements
const hardwareTotalHeader = document.getElementById('hardware-total-header');
const hardwareTotalVal = document.getElementById('hardware-total-val');
const servicesTotalHeader = document.getElementById('services-total-header');
const supportTotalHeader = document.getElementById('support-total-header');

const subtotalHardwareEl = document.getElementById('subtotal-hardware');
const subtotalServicesEl = document.getElementById('subtotal-services');
const subtotalSupportEl = document.getElementById('subtotal-support');
const subtotalSoftwareEl = document.getElementById('subtotal-software');
const softwareDiscountEl = document.getElementById('software-discount');
const rowItemDiscounts = document.getElementById('row-item-discounts');
const itemDiscountsVal = document.getElementById('item-discounts-val');
const taxAmountEl = document.getElementById('tax-amount');
const grandTotalEl = document.getElementById('grand-total');

// Helper to Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Helper to parse currency float
function parseCurrencyString(str) {
  return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
}



function populateCategoryDropdown() {
  if (!addCategorySel) return;
  addCategorySel.innerHTML = '';
  invoiceData.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    addCategorySel.appendChild(opt);
  });
}

// Initial Render and Calculation Hook
function init() {
  populateCategoryDropdown();
  renderAllTables();
  calculateTotals();
  setupEventListeners();
  syncDatesFromInputs();
  loadAndRenderVersions();
  initSecurity();
}

// Sync Dates from Inputs to Invoice Sheet
function syncDatesFromInputs() {
  const invoiceDate = new Date(sidebarInvoiceDate.value);
  const dueDate = new Date(sidebarDueDate.value);
  
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  
  sheetInvoiceDate.textContent = invoiceDate.toLocaleDateString('en-US', options);
  sheetDueDate.textContent = dueDate.toLocaleDateString('en-US', options);
  // Only sync to sheet if it's not currently being edited
  if (document.activeElement !== sheetInvoiceNo) {
    sheetInvoiceNo.textContent = sidebarInvoiceNo.value;
  }

  // Sync the inline edit inputs
  const inlineInvoiceNo = document.getElementById('inline-invoice-no');
  const inlineInvoiceDate = document.getElementById('inline-invoice-date');
  const inlineDueDate = document.getElementById('inline-due-date');
  if (inlineInvoiceNo) inlineInvoiceNo.value = sidebarInvoiceNo.value;
  if (inlineInvoiceDate) inlineInvoiceDate.value = sidebarInvoiceDate.value;
  if (inlineDueDate) inlineDueDate.value = sidebarDueDate.value;
}

// Render dynamic tables
function renderAllTables() {
  const defaultSections = ['hardware', 'services', 'support', 'software'];
  defaultSections.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      if (invoiceData.deletedCategories.includes(id)) {
        el.classList.add('blank-template-hide');
      } else {
        el.classList.remove('blank-template-hide');
      }
      
      // Apply custom title if set
      if (invoiceData.customTitles[id]) {
        const titleEl = el.querySelector('.category-title');
        if (titleEl) {
          titleEl.textContent = invoiceData.customTitles[id];
        }
      }
    }
  });

  renderHardwareTable();
  renderServicesTable();
  renderSupportTable();
  renderSoftwareTable();
  renderCustomCategories();
}


function renderHardwareTable() {
  hardwareBody.innerHTML = '';
  invoiceData.hardware.forEach((item, index) => {
    const isDisc = item.isDiscounted;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="item-desc-container">
          <span class="editable-field ${isDisc ? 'struck-off' : ''}" data-cat="hardware" data-idx="${index}" data-prop="desc" contenteditable="${isEditMode}">${item.desc}</span>
          <span class="editable-field item-subdesc ${isDisc ? 'struck-off' : ''}" data-cat="hardware" data-idx="${index}" data-prop="subDesc" contenteditable="${isEditMode}">${item.subDesc || ''}</span>
        </div>
      </td>
      <td class="text-center"><span class="editable-field" data-cat="hardware" data-idx="${index}" data-prop="qty" contenteditable="${isEditMode}">${item.qty}</span></td>
      <td class="text-right"><em>Included</em></td>
      <td class="col-action print-hidden">
        <button class="btn-discount-toggle ${isDisc ? 'active' : ''}" title="Toggle Discount" onclick="toggleDiscount('hardware', ${index})">🏷️</button>
        <button class="btn-danger-outline" onclick="deleteItem('hardware', ${index})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </td>
    `;
    hardwareBody.appendChild(tr);
  });
  
  if (isEditMode) {
    const trAdd = document.createElement('tr');
    trAdd.className = 'add-item-row print-hidden';
    trAdd.innerHTML = `
      <td colspan="4">
        <button class="btn-add-item-inline" onclick="addNewItemInline('hardware')">
          <span class="icon">＋</span> Add Item
        </button>
      </td>
    `;
    hardwareBody.appendChild(trAdd);
  }
  
  // Set Package Price Value
  hardwareTotalVal.textContent = formatCurrency(invoiceData.hardwarePackagePrice);
}

function renderServicesTable() {
  servicesBody.innerHTML = '';
  invoiceData.services.forEach((item, index) => {
    const isDisc = item.isDiscounted;
    const amount = item.qty * item.rate;
    const tr = document.createElement('tr');
    
    let amountHtml = isDisc 
      ? `<s>${formatCurrency(amount)}</s> <span class="discount-badge-item">Discounted</span>`
      : `<span class="editable-field" data-cat="services" data-idx="${index}" data-prop="rate" contenteditable="${isEditMode}">${formatCurrency(amount)}</span>`;
      
    tr.innerHTML = `
      <td>
        <div class="item-desc-container">
          <span class="editable-field ${isDisc ? 'struck-off' : ''}" data-cat="services" data-idx="${index}" data-prop="desc" contenteditable="${isEditMode}">${item.desc}</span>
          <span class="editable-field item-subdesc ${isDisc ? 'struck-off' : ''}" data-cat="services" data-idx="${index}" data-prop="subDesc" contenteditable="${isEditMode}">${item.subDesc || ''}</span>
        </div>
      </td>
      <td class="text-center"><span class="editable-field" data-cat="services" data-idx="${index}" data-prop="qty" contenteditable="${isEditMode}">${item.qty}</span></td>
      <td class="text-right">${amountHtml}</td>
      <td class="col-action print-hidden">
        <button class="btn-discount-toggle ${isDisc ? 'active' : ''}" title="Toggle Discount" onclick="toggleDiscount('services', ${index})">🏷️</button>
        <button class="btn-danger-outline" onclick="deleteItem('services', ${index})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </td>
    `;
    servicesBody.appendChild(tr);
  });
  
  if (isEditMode) {
    const trAdd = document.createElement('tr');
    trAdd.className = 'add-item-row print-hidden';
    trAdd.innerHTML = `
      <td colspan="4">
        <button class="btn-add-item-inline" onclick="addNewItemInline('services')">
          <span class="icon">＋</span> Add Item
        </button>
      </td>
    `;
    servicesBody.appendChild(trAdd);
  }
}

function renderSupportTable() {
  supportBody.innerHTML = '';
  invoiceData.support.forEach((item, index) => {
    const isDisc = item.isDiscounted;
    const amount = item.qty * item.rate;
    const tr = document.createElement('tr');
    
    let amountHtml = isDisc 
      ? `<s>${formatCurrency(amount)}</s> <span class="discount-badge-item">Discounted</span>`
      : `<span class="editable-field" data-cat="support" data-idx="${index}" data-prop="rate" contenteditable="${isEditMode}">${formatCurrency(amount)}</span>`;
      
    tr.innerHTML = `
      <td>
        <div class="item-desc-container">
          <span class="editable-field ${isDisc ? 'struck-off' : ''}" data-cat="support" data-idx="${index}" data-prop="desc" contenteditable="${isEditMode}">${item.desc}</span>
          <span class="editable-field item-subdesc ${isDisc ? 'struck-off' : ''}" data-cat="support" data-idx="${index}" data-prop="subDesc" contenteditable="${isEditMode}">${item.subDesc || ''}</span>
        </div>
      </td>
      <td class="text-center"><span class="editable-field" data-cat="support" data-idx="${index}" data-prop="qty" contenteditable="${isEditMode}">${item.qty}</span></td>
      <td class="text-right">${amountHtml}</td>
      <td class="col-action print-hidden">
        <button class="btn-discount-toggle ${isDisc ? 'active' : ''}" title="Toggle Discount" onclick="toggleDiscount('support', ${index})">🏷️</button>
        <button class="btn-danger-outline" onclick="deleteItem('support', ${index})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </td>
    `;
    supportBody.appendChild(tr);
  });
  
  if (isEditMode) {
    const trAdd = document.createElement('tr');
    trAdd.className = 'add-item-row print-hidden';
    trAdd.innerHTML = `
      <td colspan="4">
        <button class="btn-add-item-inline" onclick="addNewItemInline('support')">
          <span class="icon">＋</span> Add Item
        </button>
      </td>
    `;
    supportBody.appendChild(trAdd);
  }
}

function renderSoftwareTable() {
  softwareBody.innerHTML = '';
  invoiceData.software.forEach((item, index) => {
    const isDisc = item.isDiscounted;
    const amountToday = (item.isPromo || isDisc) ? 0 : (item.qty * item.rate);
    const amountTodayText = (item.isPromo || isDisc) ? 'FREE (First 30 Days)' : formatCurrency(amountToday);
    const discount = (item.isPromo || isDisc) ? (item.qty * item.rate) : 0;
    const discountText = (item.isPromo || isDisc) ? `-${formatCurrency(discount)}` : '$0.00';
    
    let amountHtml = (item.isPromo || isDisc)
      ? `<strong>${amountTodayText}</strong>`
      : `<span class="editable-field" data-cat="software" data-idx="${index}" data-prop="rate" contenteditable="${isEditMode}">${formatCurrency(amountToday)}</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="item-desc-container">
          <span class="editable-field ${isDisc ? 'struck-off' : ''}" data-cat="software" data-idx="${index}" data-prop="desc" contenteditable="${isEditMode}">${item.desc}</span>
          <span class="editable-field item-subdesc ${isDisc ? 'struck-off' : ''}" data-cat="software" data-idx="${index}" data-prop="subDesc" contenteditable="${isEditMode}">${item.subDesc || ''}</span>
        </div>
      </td>
      <td class="text-right">${amountHtml}</td>
      <td class="text-right pink-text" style="color: var(--accent-pink)">${discountText}</td>
      <td class="col-action print-hidden">
        <button class="btn-discount-toggle ${isDisc ? 'active' : ''}" title="Toggle Discount" onclick="toggleDiscount('software', ${index})">🏷️</button>
        <button class="btn-danger-outline" onclick="deleteItem('software', ${index})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </td>
    `;
    softwareBody.appendChild(tr);
  });
  
  if (isEditMode) {
    const trAdd = document.createElement('tr');
    trAdd.className = 'add-item-row print-hidden';
    trAdd.innerHTML = `
      <td colspan="4">
        <button class="btn-add-item-inline" onclick="addNewItemInline('software')">
          <span class="icon">＋</span> Add Item
        </button>
      </td>
    `;
    softwareBody.appendChild(trAdd);
  }
}

function renderCustomCategories() {
  const container = document.querySelector('.invoice-body');
  if (!container) return;
  
  // Clean up custom categories that are deleted
  const existingCustomSections = container.querySelectorAll('.invoice-section[id^="section-cat_"]');
  existingCustomSections.forEach(sec => {
    const id = sec.id.replace('section-', '');
    if (!invoiceData.categories.some(c => c.id === id)) {
      sec.remove();
    }
  });

  // Render each custom category
  invoiceData.categories.forEach(cat => {
    if (!cat.isPackage && cat.id !== 'services' && cat.id !== 'support' && cat.id !== 'software') {
      let sec = document.getElementById(`section-${cat.id}`);
      if (!sec) {
        sec = document.createElement('div');
        sec.className = 'invoice-section';
        sec.id = `section-${cat.id}`;
        sec.innerHTML = `
          <div class="section-header">
            <h4 class="category-title editable-category-title" data-cat-id="${cat.id}" contenteditable="${isEditMode}">${cat.name}</h4>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="custom-badge">${cat.name.replace(/^\d+\.\s*/, '')} Total: <span id="${cat.id}-total-header">$0.00</span></span>
              <button class="btn-danger-outline print-hidden edit-only-inline" onclick="deleteCategory('${cat.id}')" title="Delete Category" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-desc">Description</th>
                <th class="col-qty text-center">Qty</th>
                <th class="col-amount text-right">Amount</th>
                <th class="col-action print-hidden"></th>
              </tr>
            </thead>
            <tbody id="${cat.id}-items-body">
            </tbody>
          </table>
        `;
        container.appendChild(sec);
      }
      
      const body = document.getElementById(`${cat.id}-items-body`);
      if (body) {
        body.innerHTML = '';
        const items = invoiceData[cat.id] || [];
        items.forEach((item, index) => {
          const isDisc = item.isDiscounted;
          const tr = document.createElement('tr');
          
          let amountHtml = isDisc 
            ? `<s>${formatCurrency(item.qty * item.rate)}</s> <span class="discount-badge-item">Discounted</span>`
            : `<span class="editable-field" data-cat="${cat.id}" data-idx="${index}" data-prop="rate" contenteditable="${isEditMode}">${formatCurrency(item.qty * item.rate)}</span>`;
            
          tr.innerHTML = `
            <td>
              <div class="item-desc-container">
                <span class="editable-field ${isDisc ? 'struck-off' : ''}" data-cat="${cat.id}" data-idx="${index}" data-prop="desc" contenteditable="${isEditMode}">${item.desc}</span>
                <span class="editable-field item-subdesc ${isDisc ? 'struck-off' : ''}" data-cat="${cat.id}" data-idx="${index}" data-prop="subDesc" contenteditable="${isEditMode}">${item.subDesc || ''}</span>
              </div>
            </td>
            <td class="text-center"><span class="editable-field" data-cat="${cat.id}" data-idx="${index}" data-prop="qty" contenteditable="${isEditMode}">${item.qty}</span></td>
            <td class="text-right">${amountHtml}</td>
            <td class="col-action print-hidden">
              <button class="btn-discount-toggle ${isDisc ? 'active' : ''}" title="Toggle Discount" onclick="toggleDiscount('${cat.id}', ${index})">🏷️</button>
              <button class="btn-danger-outline" onclick="deleteItem('${cat.id}', ${index})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </td>
          `;
          body.appendChild(tr);
        });
        
        if (isEditMode) {
          const trAdd = document.createElement('tr');
          trAdd.className = 'add-item-row print-hidden';
          trAdd.innerHTML = `
            <td colspan="4">
              <button class="btn-add-item-inline" onclick="addNewItemInline('${cat.id}')">
                <span class="icon">＋</span> Add Item
              </button>
            </td>
          `;
          body.appendChild(trAdd);
        }
      }
    }
  });
}

let categoryToDelete = null;

window.deleteCategory = function(catId) {
  categoryToDelete = catId;
  const dialog = document.getElementById('delete-category-dialog');
  if (dialog) dialog.showModal();
};

function performDeleteCategory() {
  if (!categoryToDelete) return;
  const catId = categoryToDelete;
  const defaultCats = ['hardware', 'services', 'support', 'software'];
  
  if (defaultCats.includes(catId)) {
    if (!invoiceData.deletedCategories.includes(catId)) {
      invoiceData.deletedCategories.push(catId);
    }
    invoiceData[catId] = [];
    if (catId === 'hardware') invoiceData.hardwarePackagePrice = 0;
  } else {
    // Remove from invoiceData.categories array
    invoiceData.categories = invoiceData.categories.filter(c => c.id !== catId);
    
    // Clear out any items in that category from the state
    if (invoiceData[catId]) {
      delete invoiceData[catId];
    }
    
    // Remove the HTML section
    const sec = document.getElementById(`section-${catId}`);
    if (sec) sec.remove();
  }
  
  // Re-render
  populateCategoryDropdown();
  renderAllTables();
  calculateTotals();
  
  categoryToDelete = null;
  const dialog = document.getElementById('delete-category-dialog');
  if (dialog) dialog.close();
}

function renderTotalsTable(subtotalToday, taxAmount, grandTotal, softwareTotalPromoDiscount, itemDiscountsTotal) {
  const tbody = document.querySelector('.totals-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  // 1. Hardware
  if (!invoiceData.deletedCategories.includes('hardware')) {
    const hardwareTotal = invoiceData.hardwarePackagePrice;
    const trHard = document.createElement('tr');
    trHard.innerHTML = `<th>${invoiceData.customTitles['hardware'] || 'Hardware Package'}:</th><td id="subtotal-hardware">${formatCurrency(hardwareTotal)}</td>`;
    tbody.appendChild(trHard);
  }
    
    // 2. Services
    if (!invoiceData.deletedCategories.includes('services')) {
      const servicesOriginal = invoiceData.services.reduce((sum, item) => sum + (item.qty * item.rate), 0);
      const trServ = document.createElement('tr');
      trServ.innerHTML = `<th>${invoiceData.customTitles['services'] || 'Professional Services'}:</th><td id="subtotal-services">${formatCurrency(servicesOriginal)}</td>`;
      tbody.appendChild(trServ);
    }
    
    // 3. Support
    if (!invoiceData.deletedCategories.includes('support')) {
      const supportOriginal = invoiceData.support.reduce((sum, item) => sum + (item.qty * item.rate), 0);
      const trSupp = document.createElement('tr');
      trSupp.innerHTML = `<th>${invoiceData.customTitles['support'] || 'Additional Support'}:</th><td id="subtotal-support">${formatCurrency(supportOriginal)}</td>`;
      tbody.appendChild(trSupp);
    }
    
    // 4. Software
    if (!invoiceData.deletedCategories.includes('software')) {
      let softwareTotalToday = 0;
      invoiceData.software.forEach(item => {
        if (!item.isPromo && !item.isDiscounted) {
          softwareTotalToday += item.qty * item.rate;
        }
      });
    const trSoft = document.createElement('tr');
    trSoft.innerHTML = `<th>${invoiceData.customTitles['software'] || 'Software Today (Discounted)'}:</th><td id="subtotal-software">${formatCurrency(softwareTotalToday)}</td>`;
    tbody.appendChild(trSoft);
  }
  
  // 5. Custom Categories
  invoiceData.categories.forEach(cat => {
    if (!cat.isPackage && cat.id !== 'services' && cat.id !== 'support' && cat.id !== 'software') {
      const items = invoiceData[cat.id] || [];
      const orig = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
      const trCust = document.createElement('tr');
      trCust.innerHTML = `<th>${cat.name.replace(/^\d+\.\s*/, '')}:</th><td>${formatCurrency(orig)}</td>`;
      tbody.appendChild(trCust);
    }
  });
  
  // 6. Software Discount
  if (softwareTotalPromoDiscount > 0) {
    const trSoftDisc = document.createElement('tr');
    trSoftDisc.className = 'discount-row';
    trSoftDisc.innerHTML = `<th>First Month Software Discount:</th><td id="software-discount">-${formatCurrency(softwareTotalPromoDiscount)}</td>`;
    tbody.appendChild(trSoftDisc);
  }
  
  // 7. Item Discounts (Struck Off)
  if (itemDiscountsTotal > 0) {
    const trItemDisc = document.createElement('tr');
    trItemDisc.className = 'discount-row';
    trItemDisc.id = 'row-item-discounts';
    trItemDisc.innerHTML = `<th>Item Discounts (Struck Off):</th><td id="item-discounts-val">-${formatCurrency(itemDiscountsTotal)}</td>`;
    tbody.appendChild(trItemDisc);
  }
  
  // 8. Tax
  const trTax = document.createElement('tr');
  trTax.innerHTML = `<th>Tax (8.25%):</th><td id="tax-amount">${formatCurrency(taxAmount)}</td>`;
  tbody.appendChild(trTax);
  
  // 9. Grand Total
  const trGrand = document.createElement('tr');
  trGrand.className = 'grand-total-row';
  trGrand.innerHTML = `<th>TOTAL AMOUNT DUE:</th><td id="grand-total">${formatCurrency(grandTotal)}</td>`;
  tbody.appendChild(trGrand);
}

// Calculate all subtotals and grand totals
function calculateTotals() {
  // 1. Hardware Total (Comes from package total)
  const hardwareTotal = invoiceData.hardwarePackagePrice;
  const hardwareTotalHeader = document.getElementById('hardware-total-header');
  if (hardwareTotalHeader) hardwareTotalHeader.textContent = formatCurrency(hardwareTotal);
  
  // 2. Services Total
  const servicesTotalOriginal = invoiceData.services.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const servicesTotalDiscount = invoiceData.services.reduce((sum, item) => item.isDiscounted ? sum + (item.qty * item.rate) : sum, 0);
  const servicesTotalHeader = document.getElementById('services-total-header');
  if (servicesTotalHeader) servicesTotalHeader.textContent = formatCurrency(servicesTotalOriginal - servicesTotalDiscount);
  
  // 3. Support Total
  const supportTotalOriginal = invoiceData.support.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const supportTotalDiscount = invoiceData.support.reduce((sum, item) => item.isDiscounted ? sum + (item.qty * item.rate) : sum, 0);
  const supportTotalHeader = document.getElementById('support-total-header');
  if (supportTotalHeader) supportTotalHeader.textContent = formatCurrency(supportTotalOriginal - supportTotalDiscount);
  
  // 4. Software Subtotals & Promo
  let softwareTotalToday = 0;
  let softwareTotalPromoDiscount = 0;
  let softwareRecurring = 0;

  invoiceData.software.forEach(item => {
    softwareRecurring += item.qty * item.rate;
    if (item.isPromo || item.isDiscounted) {
      softwareTotalPromoDiscount += item.qty * item.rate;
    } else {
      softwareTotalToday += item.qty * item.rate;
    }
  });
  
  // 5. Custom Categories Totals
  let customSubtotalsOriginal = 0;
  let customDiscounts = 0;
  
  invoiceData.categories.forEach(cat => {
    if (!cat.isPackage && cat.id !== 'services' && cat.id !== 'support' && cat.id !== 'software') {
      const items = invoiceData[cat.id] || [];
      const orig = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
      const disc = items.reduce((sum, i) => i.isDiscounted ? sum + (i.qty * i.rate) : sum, 0);
      customSubtotalsOriginal += orig;
      customDiscounts += disc;
      
      const badge = document.getElementById(`${cat.id}-total-header`);
      if (badge) badge.textContent = formatCurrency(orig - disc);
    }
  });

  // Calculate Item Discounts Total
  const itemDiscountsTotal = servicesTotalDiscount + supportTotalDiscount + customDiscounts;
  
  // Update Promo Banner Subtext dynamically
  const promoCallout = document.querySelector('.promo-callout p');
  if (promoCallout) {
    const listPromos = invoiceData.software.filter(item => item.isPromo);
    let promoDescText = "";
    if (listPromos.length > 0) {
      const itemsString = listPromos.map(item => `${item.desc}: ${formatCurrency(item.rate)}/month`).join(', ');
      promoDescText = `The promotional software is provided free for the first 30 days. After 30 days, monthly billing will begin automatically: <strong>${itemsString}</strong>. Total recurring software subscription: <strong>${formatCurrency(softwareRecurring)}/month</strong>.`;
    } else {
      promoDescText = `No active promotional offers. Monthly recurring software subscriptions: <strong>${formatCurrency(softwareRecurring)}/month</strong>.`;
    }
    promoCallout.innerHTML = `<strong>Promotional Offer:</strong> ${promoDescText}`;
  }

  // 6. Grand Total Due Today
  const subtotalToday = hardwareTotal + servicesTotalOriginal + supportTotalOriginal + softwareTotalToday + customSubtotalsOriginal - itemDiscountsTotal;
  const taxAmount = subtotalToday * 0.0825;
  const grandTotal = subtotalToday + taxAmount;
  
  renderTotalsTable(subtotalToday, taxAmount, grandTotal, softwareTotalPromoDiscount, itemDiscountsTotal);
}

// Delete item helper
window.deleteItem = function(category, index) {
  invoiceData[category].splice(index, 1);
  renderAllTables();
  calculateTotals();
};

// Toggle discount helper
window.toggleDiscount = function(category, index) {
  const item = invoiceData[category][index];
  item.isDiscounted = !item.isDiscounted;
  renderAllTables();
  calculateTotals();
};

// Add new item inline helper
window.addNewItemInline = function(category) {
  const newItem = {
    id: Math.random().toString(36).substring(2, 9),
    desc: 'New Item',
    subDesc: '',
    qty: 1,
    rate: 0
  };

  if (category === 'software') {
    newItem.isPromo = false;
  }

  if (!invoiceData[category]) {
    invoiceData[category] = [];
  }

  invoiceData[category].push(newItem);
  renderAllTables();
  calculateTotals();

  // Focus and select the description of the newly created item
  setTimeout(() => {
    const fields = document.querySelectorAll(`[data-cat="${category}"][data-prop="desc"]`);
    if (fields.length > 0) {
      const lastField = fields[fields.length - 1];
      lastField.focus();
      const range = document.createRange();
      range.selectNodeContents(lastField);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 50);
};

// Setup DOM event listeners
function setupEventListeners() {
  // Create Custom Category Handler
  if (addCategoryBtn && newCategoryNameInput) {
    addCategoryBtn.addEventListener('click', () => {
      const name = newCategoryNameInput.value.trim();
      if (!name) {
        alert("Please enter a category name.");
        return;
      }
      
      const nextNum = invoiceData.categories.length + 1;
      let formattedName = name;
      if (!/^\d+\./.test(name)) {
        formattedName = `${nextNum}. ${name}`;
      }
      
      const newId = 'cat_' + Date.now();
      
      invoiceData.categories.push({
        id: newId,
        name: formattedName,
        isPackage: false
      });
      invoiceData[newId] = []; // Initialize empty items list
      
      newCategoryNameInput.value = '';
      
      populateCategoryDropdown();
      renderAllTables();
      calculateTotals();
      
      alert(`Category "${formattedName}" created successfully!`);
    });
  }

  // Theme Toggle Handler
  themeToggleBtn.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    if (isDarkTheme) {
      bodyEl.classList.add('dark-theme');
      bodyEl.classList.remove('light-theme');
      themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      bodyEl.classList.remove('dark-theme');
      bodyEl.classList.add('light-theme');
      themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
  });

    // Edit/Preview Mode Toggle
  modeToggleBtn.addEventListener('click', () => {
    isEditMode = !isEditMode;
    if (isEditMode) {
      bodyEl.classList.add('edit-active');
      modeToggleBtn.setAttribute('title', 'Switch to Preview Mode');
    } else {
      bodyEl.classList.remove('edit-active');
      modeToggleBtn.setAttribute('title', 'Switch to Edit Mode');
    }
    
    // Toggle contenteditable on custom category titles
    document.querySelectorAll('.editable-category-title').forEach(el => {
      el.setAttribute('contenteditable', isEditMode);
    });
    
    renderAllTables();
  });

  // Print Action
  printBtn.addEventListener('click', () => {
    // If in edit mode, toggle back to preview mode first for neat print
    if (isEditMode) {
      modeToggleBtn.click();
    }
    window.print();
  });

  // Category Selector Change in Sidebar
  addCategorySel.addEventListener('change', (e) => {
    if (e.target.value === 'software') {
      promoCheckboxContainer.style.display = 'flex';
      document.getElementById('price-label').textContent = 'Monthly Price ($)';
    } else if (e.target.value === 'services') {
      promoCheckboxContainer.style.display = 'none';
      document.getElementById('price-label').textContent = 'Hourly Rate ($)';
    } else {
      promoCheckboxContainer.style.display = 'none';
      document.getElementById('price-label').textContent = 'Price / Rate ($)';
    }
  });

  // Add Item Click
  addItemBtn.addEventListener('click', () => {
    const category = addCategorySel.value;
    const desc = addDescInput.value.trim() || 'New Item';
    const subDesc = addSubdescInput.value.trim();
    const qty = parseInt(addQtyInput.value) || 1;
    const rate = parseFloat(addPriceInput.value) || 0;
    const isPromo = category === 'software' && addIsPromoChk.checked;

    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      desc: desc,
      subDesc: subDesc,
      qty: qty,
      rate: rate
    };

    if (category === 'software') {
      newItem.isPromo = isPromo;
    }

    invoiceData[category].push(newItem);
    
    // Clear inputs
    addDescInput.value = '';
    addSubdescInput.value = '';
    addQtyInput.value = '1';
    addPriceInput.value = '100';

    renderAllTables();
    calculateTotals();
  });

  // Sync inputs from sidebar date/invoice elements to sheet
  sidebarInvoiceNo.addEventListener('input', syncDatesFromInputs);
  sidebarInvoiceDate.addEventListener('change', syncDatesFromInputs);
  sidebarDueDate.addEventListener('change', syncDatesFromInputs);

  // Sync inline edit inputs back to sidebar elements
  const inlineInvoiceDate = document.getElementById('inline-invoice-date');
  const inlineDueDate = document.getElementById('inline-due-date');
  if (inlineInvoiceDate) {
    inlineInvoiceDate.addEventListener('change', (e) => {
      sidebarInvoiceDate.value = e.target.value;
      syncDatesFromInputs();
    });
  }
  if (inlineDueDate) {
    inlineDueDate.addEventListener('change', (e) => {
      sidebarDueDate.value = e.target.value;
      syncDatesFromInputs();
    });
  }

  // Sync Payment details inputs to sheet
  inputShowPayment.addEventListener('change', (e) => {
    if (e.target.checked) {
      paymentMethodsBox.classList.remove('hidden');
      paymentDetailsInputs.style.display = 'flex';
    } else {
      paymentMethodsBox.classList.add('hidden');
      paymentDetailsInputs.style.display = 'none';
    }
  });

  // Toggle status badge visibility
  inputShowStatus.addEventListener('change', (e) => {
    if (e.target.checked) {
      statusBadgeBox.classList.remove('hidden');
    } else {
      statusBadgeBox.classList.add('hidden');
    }
  });

  const syncPaymentText = () => {
    paymentWireText.innerHTML = `<strong>Wire Transfer:</strong> ${inputPaymentWire.value}`;
    paymentOnlineText.innerHTML = `<strong>Online:</strong> Pay via Stripe Credit Card link at ${inputPaymentOnline.value}`;
  };

  inputPaymentWire.addEventListener('input', syncPaymentText);
  inputPaymentOnline.addEventListener('input', syncPaymentText);
  
  // Trigger initial payment text sync
  syncPaymentText();

  // Sync sheet edit back to sidebar
  const inlineInvoiceNo = document.getElementById('inline-invoice-no');
  if (inlineInvoiceNo) {
    inlineInvoiceNo.addEventListener('input', (e) => {
      sidebarInvoiceNo.value = e.target.value;
      syncDatesFromInputs();
    });
  }

  // Monitor sheet inline content edits
  document.getElementById('invoice-sheet').addEventListener('blur', (e) => {
    const target = e.target;
    if (target.classList.contains('editable-field')) {
      const cat = target.dataset.cat;
      const idx = parseInt(target.dataset.idx);
      const prop = target.dataset.prop;
      
      let val = target.textContent.trim();
      
      if (prop === 'qty') {
        const parsed = parseInt(val) || 0;
        invoiceData[cat][idx].qty = parsed;
      } else if (prop === 'rate') {
        const parsed = parseCurrencyString(val);
        let qty = invoiceData[cat][idx].qty || 0;
        if (qty === 0 && parsed > 0) {
          qty = 1;
          invoiceData[cat][idx].qty = 1;
        }
        invoiceData[cat][idx].rate = qty > 0 ? (parsed / qty) : parsed;
      } else if (prop === 'desc') {
        invoiceData[cat][idx].desc = val;
      } else if (prop === 'subDesc') {
        invoiceData[cat][idx].subDesc = val;
      }
      
      renderAllTables();
      calculateTotals();
    } else if (target.classList.contains('editable-category-title')) {
      const catId = target.dataset.catId;
      const val = target.textContent.trim() || 'Untitled Category';
      const defaultCats = ['hardware', 'services', 'support', 'software'];
      
      if (defaultCats.includes(catId)) {
        invoiceData.customTitles[catId] = val;
        renderAllTables();
      } else {
        const catObj = invoiceData.categories.find(c => c.id === catId);
        if (catObj) {
          catObj.name = val;
          populateCategoryDropdown();
          renderAllTables();
        }
      }
    } else if (target.id === 'hardware-total-val') {
      const parsed = parseCurrencyString(target.textContent);
      invoiceData.hardwarePackagePrice = parsed;
      renderAllTables();
      calculateTotals();
    }
  }, true);

  // Open Settings Hub Modal
  if (openSettingsBtn && settingsDialog) {
    openSettingsBtn.addEventListener('click', () => {
      settingsDialog.showModal();
    });
  }

  // Inline Add New Category (Instant)
  const inlineAddCategoryBtn = document.getElementById('inline-add-category-btn');
  if (inlineAddCategoryBtn) {
    inlineAddCategoryBtn.addEventListener('click', () => {
      const newId = 'custom_' + Date.now();
      invoiceData.categories.push({
        id: newId,
        name: 'Untitled Category',
        isPackage: false
      });
      invoiceData[newId] = [];
      populateCategoryDropdown();
      renderAllTables();
      calculateTotals();
      
      // Auto-focus the new category title
      setTimeout(() => {
        const titleEl = document.querySelector(`.editable-category-title[data-cat-id="${newId}"]`);
        if (titleEl) {
          titleEl.focus();
          // Select all text inside
          document.execCommand('selectAll', false, null);
        }
      }, 50);
    });
  }

  // Open Drafts Hub Modal
  if (draftsHubBtn && draftsHubDialog) {
    draftsHubBtn.addEventListener('click', () => {
      if (draftsSearchInput) draftsSearchInput.value = '';
      loadAndRenderVersions();
      draftsHubDialog.showModal();
    });
  }

  // Close Drafts Hub Modal
  if (closeDraftsHubBtn && draftsHubDialog) {
    closeDraftsHubBtn.addEventListener('click', () => {
      draftsHubDialog.close();
    });
  }

  // Drafts Search Input
  if (draftsSearchInput) {
    draftsSearchInput.addEventListener('input', (e) => {
      loadAndRenderVersions(e.target.value);
    });
  }

  // Close Settings Hub Modal
  if (closeSettingsBtn && settingsDialog) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsDialog.close();
    });
  }

  if (saveCloseSettingsBtn && settingsDialog) {
    saveCloseSettingsBtn.addEventListener('click', () => {
      // Save PIN configurations
      const inputEnablePin = document.getElementById('input-enable-pin');
      const inputSecurityPin = document.getElementById('input-security-pin');
      
      if (inputEnablePin) {
        localStorage.setItem('invoice_pin_enabled', inputEnablePin.checked ? 'true' : 'false');
      }
      if (inputSecurityPin) {
        const pinVal = inputSecurityPin.value.trim();
        if (pinVal.length === 4 && /^\d+$/.test(pinVal)) {
          localStorage.setItem('invoice_security_pin', pinVal);
        } else if (inputEnablePin && inputEnablePin.checked) {
          alert("Security PIN must be a 4-digit number. Reverting to previous PIN.");
          inputSecurityPin.value = localStorage.getItem('invoice_security_pin') || '1234';
        }
      }
      
      settingsDialog.close();
      
      // Sync overlay state
      initSecurity();
    });
  }

  // Close settings dialog when clicking on the backdrop
  if (settingsDialog) {
    settingsDialog.addEventListener('click', (e) => {
      const rect = settingsDialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        settingsDialog.close();
      }
    });
  }

  // Settings Modal Tab Navigation
  const tabButtons = document.querySelectorAll('.dialog-tabs .tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Security tab inputs toggling
  const inputEnablePin = document.getElementById('input-enable-pin');
  if (inputEnablePin) {
    inputEnablePin.addEventListener('change', (e) => {
      togglePinSettingsVisibility(e.target.checked);
    });
  }

  // Save Draft from sidebar
  const saveDraftBtn = document.getElementById('save-draft-btn');
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', saveCurrentVersion);
  }

  // Home action
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }

  // Logout action
  const logoutBtn = document.getElementById('logout-btn');
  const logoutDialog = document.getElementById('logout-dialog');
  const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
  const cancelLogoutBtn = document.getElementById('cancel-logout-btn');

  if (logoutBtn && logoutDialog) {
    logoutBtn.addEventListener('click', () => {
      logoutDialog.showModal();
    });

    cancelLogoutBtn.addEventListener('click', () => {
      logoutDialog.close();
    });

    confirmLogoutBtn.addEventListener('click', () => {
      logoutDialog.close();
      sessionStorage.removeItem('invoice_hub_authenticated');
      window.location.reload();
    });
  }
  
  // Delete Category Dialog Listeners
  const deleteCategoryDialog = document.getElementById('delete-category-dialog');
  const cancelDeleteCategoryBtn = document.getElementById('cancel-delete-category-btn');
  const confirmDeleteCategoryBtn = document.getElementById('confirm-delete-category-btn');
  
  if (cancelDeleteCategoryBtn && deleteCategoryDialog) {
    cancelDeleteCategoryBtn.addEventListener('click', () => {
      categoryToDelete = null;
      deleteCategoryDialog.close();
    });
  }
  
  if (confirmDeleteCategoryBtn) {
    confirmDeleteCategoryBtn.addEventListener('click', () => {
      performDeleteCategory();
    });
  }
}

function getVersions() {
  const data = localStorage.getItem('brainymed_invoice_versions');
  return data ? JSON.parse(data) : [];
}

function saveVersions(versions) {
  localStorage.setItem('brainymed_invoice_versions', JSON.stringify(versions));
}

function loadAndRenderVersions(searchQuery = '') {
  const versions = getVersions();
  
  // Filter versions if there's a search query
  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredVersions = versions.filter(ver => 
    ver.name.toLowerCase().includes(lowerQuery) || 
    ver.timestamp.toLowerCase().includes(lowerQuery)
  );
  
  // Render to Settings Modal list
  if (versionsList) {
    versionsList.innerHTML = '';
    if (filteredVersions.length === 0) {
      if (noVersionsText) noVersionsText.style.display = 'block';
    } else {
      if (noVersionsText) noVersionsText.style.display = 'none';
      filteredVersions.forEach((ver, idx) => {
        // Need to find original index for deletion/loading
        const originalIdx = versions.indexOf(ver);
        const li = document.createElement('li');
        li.className = 'version-item';
        li.onclick = () => {
          loadVersion(originalIdx);
          if (draftsHubDialog && draftsHubDialog.open) draftsHubDialog.close();
        };
        li.innerHTML = `
          <div class="version-info">
            <span class="version-name">${ver.name}</span>
            <span class="version-time">${ver.timestamp}</span>
          </div>
          <button class="btn-version-delete" title="Delete version" onclick="deleteVersion(${originalIdx}, event)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
        `;
        versionsList.appendChild(li);
      });
    }
  }

  // Render to Sidebar list
  const sidebarVersionsList = document.getElementById('sidebar-versions-list');
  const sidebarNoVersionsText = document.getElementById('sidebar-no-versions-text');
  if (sidebarVersionsList) {
    sidebarVersionsList.innerHTML = '';
    if (versions.length === 0) {
      if (sidebarNoVersionsText) sidebarNoVersionsText.style.display = 'block';
    } else {
      if (sidebarNoVersionsText) sidebarNoVersionsText.style.display = 'none';
      versions.forEach((ver, idx) => {
        const li = document.createElement('li');
        li.className = 'version-item';
        li.onclick = () => loadVersion(idx);
        li.innerHTML = `
          <div class="version-info">
            <span class="version-name">${ver.name}</span>
            <span class="version-time">${ver.timestamp}</span>
          </div>
          <button class="btn-version-delete" title="Delete draft" onclick="deleteVersion(${idx}, event)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
        `;
        sidebarVersionsList.appendChild(li);
      });
    }
  }
}

function saveCurrentVersion() {
  const invoiceNo = sidebarInvoiceNo.value.trim() || 'Invoice';
  const labelName = prompt("Enter a label for this version:", `Version ${getVersions().length + 1} (${invoiceNo})`);
  if (labelName === null) return; // Cancelled
  
  const version = {
    name: labelName || `Version ${getVersions().length + 1}`,
    timestamp: new Date().toLocaleString(),
    invoiceData: JSON.parse(JSON.stringify(invoiceData)), // Deep copy
    invoiceNo: sidebarInvoiceNo.value,
    invoiceDate: sidebarInvoiceDate.value,
    dueDate: sidebarDueDate.value,
    companyDetailsHtml: companyDetailsContainer ? companyDetailsContainer.innerHTML : "",
    clientDetailsHtml: clientDetailsContainer.innerHTML,
    statusBadgeText: statusBadge ? statusBadge.innerHTML : "",
    showPayment: inputShowPayment.checked,
    paymentWire: inputPaymentWire.value,
    paymentOnline: inputPaymentOnline.value,
    termsHtml: document.querySelector('.terms-conditions-box').innerHTML,
    showStatus: inputShowStatus.checked
  };
  
  const versions = getVersions();
  versions.push(version);
  saveVersions(versions);
  loadAndRenderVersions();
}

function loadVersion(index) {
  const versions = getVersions();
  const ver = versions[index];
  if (!ver) return;
  
  if (!confirm(`Are you sure you want to load "${ver.name}"? This will overwrite the current invoice.`)) {
    return;
  }
  
  // Restore invoiceData
  Object.assign(invoiceData, JSON.parse(JSON.stringify(ver.invoiceData)));
  
  // Restore HTML
  if (companyDetailsContainer) {
    companyDetailsContainer.innerHTML = ver.companyDetailsHtml;
  }
  clientDetailsContainer.innerHTML = ver.clientDetailsHtml;
  if (statusBadge && ver.statusBadgeText) {
    statusBadge.innerHTML = ver.statusBadgeText;
  }
  
  // Restore Inputs
  sidebarInvoiceNo.value = ver.invoiceNo;
  sidebarInvoiceDate.value = ver.invoiceDate;
  sidebarDueDate.value = ver.dueDate;
  
  inputShowPayment.checked = ver.showPayment;
  // Trigger checkbox change event manually to update visibility
  const event = new Event('change');
  inputShowPayment.dispatchEvent(event);

  inputShowStatus.checked = ver.showStatus !== undefined ? ver.showStatus : false;
  const statusEvent = new Event('change');
  inputShowStatus.dispatchEvent(statusEvent);
  
  // Restore Terms & Conditions HTML
  const termsBox = document.querySelector('.terms-conditions-box');
  if (termsBox && ver.termsHtml) {
    termsBox.innerHTML = ver.termsHtml;
  }
  
  inputPaymentWire.value = ver.paymentWire;
  inputPaymentOnline.value = ver.paymentOnline;
  
  // Trigger text update event manually
  const textEvent = new Event('input');
  inputPaymentWire.dispatchEvent(textEvent);
  inputPaymentOnline.dispatchEvent(textEvent);

  // Redraw
  syncDatesFromInputs();
  renderAllTables();
  calculateTotals();
}

function deleteVersion(index, event) {
  event.stopPropagation(); // Prevents loading the version when clicking delete
  if (!confirm("Are you sure you want to delete this version?")) return;
  
  const versions = getVersions();
  versions.splice(index, 1);
  saveVersions(versions);
  loadAndRenderVersions();
}

window.deleteVersion = deleteVersion;
window.loadVersion = loadVersion;

// --- Security & PIN Authentication Logic ---
let currentPinInput = '';

function initSecurity() {
  const loginOverlay = document.getElementById('login-overlay');
  const inputEnablePin = document.getElementById('input-enable-pin');
  const inputSecurityPin = document.getElementById('input-security-pin');

  const pinEnabled = localStorage.getItem('invoice_pin_enabled') !== 'false';
  const savedPin = localStorage.getItem('invoice_security_pin') || '1234';

  if (inputEnablePin) {
    inputEnablePin.checked = pinEnabled;
    togglePinSettingsVisibility(pinEnabled);
  }
  if (inputSecurityPin) {
    inputSecurityPin.value = savedPin;
  }

  const isAuthed = sessionStorage.getItem('invoice_hub_authenticated') === 'true';
  if (!pinEnabled || isAuthed) {
    if (loginOverlay) loginOverlay.classList.add('hidden');
  } else {
    if (loginOverlay) loginOverlay.classList.remove('hidden');
    handleClear();
    setupKeypadListeners();
    setupPhysicalKeyboardListeners();
  }
}

function togglePinSettingsVisibility(enabled) {
  const pinSettingsInputs = document.getElementById('pin-settings-inputs');
  if (pinSettingsInputs) {
    pinSettingsInputs.style.display = enabled ? 'flex' : 'none';
  }
}

function handlePinInput(digit) {
  if (currentPinInput.length >= 4) return;
  currentPinInput += digit;
  updatePinDots();
  hideError();

  if (currentPinInput.length === 4) {
    setTimeout(verifyPIN, 250);
  }
}

function handleBackspace() {
  if (currentPinInput.length === 0) return;
  currentPinInput = currentPinInput.slice(0, -1);
  updatePinDots();
  hideError();
}

function handleClear() {
  currentPinInput = '';
  updatePinDots();
  hideError();
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((dot, idx) => {
    if (idx < currentPinInput.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

function showError() {
  const errorMsg = document.getElementById('login-error-msg');
  const card = document.getElementById('login-card');
  if (errorMsg) errorMsg.classList.add('visible');
  if (card) {
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 400);
  }
}

function hideError() {
  const errorMsg = document.getElementById('login-error-msg');
  if (errorMsg) errorMsg.classList.remove('visible');
}

function verifyPIN() {
  const loginOverlay = document.getElementById('login-overlay');
  const savedPin = localStorage.getItem('invoice_security_pin') || '1234';
  if (currentPinInput === savedPin) {
    sessionStorage.setItem('invoice_hub_authenticated', 'true');
    if (loginOverlay) {
      loginOverlay.classList.add('hidden');
    }
  } else {
    showError();
    currentPinInput = '';
    setTimeout(updatePinDots, 200);
  }
}

let keypadListenersSetup = false;
function setupKeypadListeners() {
  if (keypadListenersSetup) return;
  const keypadButtons = document.querySelectorAll('.keypad-btn');
  keypadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (val === 'clear') {
        handleClear();
      } else if (val === 'backspace') {
        handleBackspace();
      } else {
        handlePinInput(val);
      }
    });
  });
  keypadListenersSetup = true;
}

let keyboardListenersSetup = false;
function setupPhysicalKeyboardListeners() {
  if (keyboardListenersSetup) return;
  document.addEventListener('keydown', (e) => {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay && !loginOverlay.classList.contains('hidden')) {
      if (e.key >= '0' && e.key <= '9') {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    }
  });
  keyboardListenersSetup = true;
}

// Run setup
window.onload = init;
