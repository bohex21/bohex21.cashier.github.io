// Simple POS logic using localStorage
const PRODUCTS_KEY = 'pos_products_v1'
const TRANSACTIONS_KEY = 'pos_transactions_v1'
let products = []
let cart = []

/* Utilities */
function fmt(n){return Number(n).toLocaleString('id-ID')}
function saveProducts(){localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))}
function loadProducts(){const s = localStorage.getItem(PRODUCTS_KEY); products = s?JSON.parse(s):[]}
function saveTransactions(arr){localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(arr))}
function loadTransactions(){const s = localStorage.getItem(TRANSACTIONS_KEY); return s?JSON.parse(s):[]}

/* Seed sample products if empty */
function seedIfEmpty(){loadProducts(); if(products.length===0){products = [
  {id:1,name:'Air Mineral 600ml',price:5000,stock:20},
  {id:2,name:'Roti Tawar',price:12000,stock:10},
  {id:3,name:'Kopi Sachet',price:3000,stock:50}
]; saveProducts();}}

/* Rendering */
function renderProducts(){const tbody = document.querySelector('#products-table tbody'); tbody.innerHTML=''
  products.forEach(p=>{
    const tr=document.createElement('tr')
    tr.innerHTML = `<td>${p.name}</td><td>Rp ${fmt(p.price)}</td><td>${p.stock==null?'—':p.stock}</td><td><button data-id="${p.id}" class="add-to-cart">Tambah</button></td>`
    tbody.appendChild(tr)
  })
}

function renderCart(){const tbody = document.querySelector('#cart-table tbody'); tbody.innerHTML=''
  cart.forEach((c,i)=>{
    const tr=document.createElement('tr')
    tr.innerHTML = `<td>${c.name}</td><td>${c.qty}</td><td>Rp ${fmt(c.price)}</td><td>Rp ${fmt(c.qty*c.price)}</td><td><button data-index="${i}" class="remove-cart">Hapus</button></td>`
    tbody.appendChild(tr)
  })
  document.getElementById('total').textContent = fmt(cart.reduce((s,it)=>s+it.price*it.qty,0))
}

function renderTransactions(){const tbody = document.querySelector('#transactions-table tbody'); tbody.innerHTML=''
  const tx = loadTransactions()
  tx.slice().reverse().forEach(t=>{
    const tr=document.createElement('tr')
    tr.innerHTML = `<td>${new Date(t.ts).toLocaleString()}</td><td>${t.items.map(i=>i.name+' x'+i.qty).join(', ')}</td><td>Rp ${fmt(t.total)}</td>`
    tbody.appendChild(tr)
  })
}

/* Actions */
function addProduct(name,price,stock){const id = products.length?Math.max(...products.map(p=>p.id))+1:1; products.push({id,name,price:Number(price),stock:stock===''?null:Number(stock)}); saveProducts(); renderProducts();}

function addToCart(productId){const p = products.find(x=>x.id==productId); if(!p) return alert('Produk tidak ditemukan');
  const inCart = cart.find(c=>c.id==p.id)
  if(inCart){
    inCart.qty++
  } else {
    cart.push({id:p.id,name:p.name,price:p.price,qty:1})
  }
  renderCart()
}

function removeCart(index){cart.splice(index,1); renderCart()}

function clearCart(){cart = []; renderCart()}

function checkout(){if(cart.length===0) return alert('Keranjang kosong');
  const total = cart.reduce((s,it)=>s+it.price*it.qty,0)
  const tx = loadTransactions()
  tx.push({ts:Date.now(),items:cart.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})),total})
  saveTransactions(tx)
  // deduct stock
  cart.forEach(ci=>{
    const p = products.find(x=>x.id==ci.id)
    if(p && p.stock!=null) p.stock = Math.max(0,p.stock - ci.qty)
  })
  saveProducts();
  clearCart();
  renderProducts();
  renderTransactions();
  alert('Transaksi tercatat. Total: Rp ' + fmt(total))
}

function exportTransactionsCSV(){const tx = loadTransactions(); if(tx.length===0) return alert('Tidak ada transaksi')
  const rows = [['waktu','items','total']]
  tx.forEach(t=>rows.push([new Date(t.ts).toISOString(), t.items.map(i=>i.name+' x'+i.qty).join('; '), t.total]))
  const csv = rows.map(r=>r.map(c=>`"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download = 'transactions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}

/* Wiring */
window.addEventListener('DOMContentLoaded', ()=>{
  seedIfEmpty(); renderProducts(); renderCart(); renderTransactions();

  document.getElementById('add-product-form').addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const price = document.getElementById('p-price').value;
    const stock = document.getElementById('p-stock').value;
    if(!name||!price) return alert('Nama dan harga diperlukan')
    addProduct(name,price,stock)
    e.target.reset()
  })

  document.querySelector('#products-table tbody').addEventListener('click', e=>{
    if(e.target.classList.contains('add-to-cart')){
      const id = Number(e.target.dataset.id); addToCart(id)
    }
  })

  document.querySelector('#cart-table tbody').addEventListener('click', e=>{
    if(e.target.classList.contains('remove-cart')){
      removeCart(Number(e.target.dataset.index))
    }
  })

  document.getElementById('checkout').addEventListener('click', ()=>{if(confirm('Lanjutkan pembayaran?')) checkout()})
  document.getElementById('clear-cart').addEventListener('click', ()=>{if(confirm('Kosongkan keranjang?')) clearCart()})
  document.getElementById('export-transactions').addEventListener('click', exportTransactionsCSV)
})
