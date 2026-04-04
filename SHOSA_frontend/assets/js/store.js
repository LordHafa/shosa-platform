(function () {
  const STORE_PHONE = '256700847088';
  const STORAGE_KEY = 'shosa_store_order_draft_v1';
  const cards = Array.from(document.querySelectorAll('.product-card'));
  const summaryList = document.getElementById('summaryList');
  const summaryTotal = document.getElementById('summaryTotal');
  const form = document.getElementById('storeOrderForm');
  const alertBox = document.getElementById('storeAlert');
  const copyBtn = document.getElementById('copyOrderBtn');
  const clearBtn = document.getElementById('clearOrderBtn');
  if (!summaryList || !summaryTotal || !form) return;

  const state = { items: {}, customerName: '', customerPhone: '', customerEmail: '', deliveryMode: 'Pick up from SHOSA', sizeInfo: '', timeline: 'As soon as available', orderNotes: '' };

  function formatUGX(value) {
    return `UGX ${Number(value || 0).toLocaleString('en-UG')}`;
  }

  function saveDraft() {
    const payload = {
      ...state,
      customerName: form.customerName.value.trim(),
      customerPhone: form.customerPhone.value.trim(),
      customerEmail: form.customerEmail.value.trim(),
      deliveryMode: form.deliveryMode.value,
      sizeInfo: form.sizeInfo.value.trim(),
      timeline: form.timeline.value,
      orderNotes: form.orderNotes.value.trim()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.items && typeof saved.items === 'object') state.items = saved.items;
      ['customerName','customerPhone','customerEmail','deliveryMode','sizeInfo','timeline','orderNotes'].forEach((key) => {
        if (typeof saved[key] !== 'undefined' && form[key]) form[key].value = saved[key];
      });
    } catch (e) {}
  }

  function orderLines() {
    return cards
      .map((card) => {
        const sku = card.dataset.sku;
        const qty = Number(state.items[sku] || 0);
        if (!qty) return null;
        const name = card.dataset.name;
        const price = Number(card.dataset.price || 0);
        const subtotal = qty * price;
        return { sku, name, price, qty, subtotal };
      })
      .filter(Boolean);
  }

  function render() {
    cards.forEach((card) => {
      const qty = Number(state.items[card.dataset.sku] || 0);
      const qtyNode = card.querySelector('[data-qty]');
      if (qtyNode) qtyNode.textContent = qty;
    });

    const lines = orderLines();
    if (!lines.length) {
      summaryList.innerHTML = '<div class="summary-empty">No items added yet. Use the + buttons above to start building your order.</div>';
      summaryTotal.textContent = 'UGX 0';
      saveDraft();
      return;
    }

    let total = 0;
    summaryList.innerHTML = lines.map((line) => {
      total += line.subtotal;
      return `<div class="summary-item"><div><strong>${line.name}</strong><div style="font-size:.84rem;color:var(--ink-soft);">${formatUGX(line.price)} × ${line.qty}</div></div><strong>${formatUGX(line.subtotal)}</strong></div>`;
    }).join('');
    summaryTotal.textContent = formatUGX(total);
    saveDraft();
  }

  function buildMessage() {
    const lines = orderLines();
    if (!lines.length) return '';
    const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const details = [
      '*SHOSA Store Order Request*',
      '',
      `Name: ${form.customerName.value.trim() || '-'}`,
      `Phone / WhatsApp: ${form.customerPhone.value.trim() || '-'}`,
      `Email: ${form.customerEmail.value.trim() || '-'}`,
      `Delivery option: ${form.deliveryMode.value}`,
      `Needed: ${form.timeline.value}`,
      `Preferred sizes: ${form.sizeInfo.value.trim() || '-'}`,
      '',
      '*Items*',
      ...lines.map((line) => `- ${line.name}: ${line.qty} × ${formatUGX(line.price)} = ${formatUGX(line.subtotal)}`),
      '',
      `Estimated total: ${formatUGX(total)}`,
      `Notes: ${form.orderNotes.value.trim() || '-'}`
    ];
    return details.join('\n');
  }

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert ${type || 'alert-info'}`;
  }

  cards.forEach((card) => {
    const sku = card.dataset.sku;
    card.addEventListener('click', (event) => {
      const action = event.target.dataset.action;
      if (!action && !event.target.closest('[data-quick-add]')) return;
      if (event.target.closest('[data-quick-add]')) {
        state.items[sku] = Number(state.items[sku] || 0) + 1;
        render();
        return;
      }
      const current = Number(state.items[sku] || 0);
      state.items[sku] = action === 'increase' ? current + 1 : Math.max(0, current - 1);
      render();
    });
  });

  ['input','change'].forEach((evt) => form.addEventListener(evt, saveDraft));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const lines = orderLines();
    if (!lines.length) {
      showAlert('Add at least one product before sending your order.', 'alert-info');
      return;
    }
    if (!form.customerName.value.trim() || !form.customerPhone.value.trim()) {
      showAlert('Enter your full name and phone / WhatsApp number before sending the order.', 'alert-info');
      return;
    }
    const message = buildMessage();
    saveDraft();
    window.open(`https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    showAlert('WhatsApp opened with your order summary. Review the message and send it to the SHOSA team.', 'alert-success');
  });

  copyBtn.addEventListener('click', async () => {
    const message = buildMessage();
    if (!message) {
      showAlert('Build your order first, then copy the summary.', 'alert-info');
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      showAlert('Order summary copied. You can paste it into WhatsApp or email.', 'alert-success');
    } catch (e) {
      showAlert('Copy failed in this browser. Try WhatsApp send instead.', 'alert-info');
    }
  });

  clearBtn.addEventListener('click', () => {
    Object.keys(state.items).forEach((key) => delete state.items[key]);
    form.reset();
    localStorage.removeItem(STORAGE_KEY);
    render();
    showAlert('Store draft cleared.', 'alert-success');
  });

  (function fadeIn() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach((el) => obs.observe(el));
  })();

  loadDraft();
  render();
})();
