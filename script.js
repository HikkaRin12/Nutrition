const GOALS = { cal: 2600, prot: 140 };
let todos = JSON.parse(localStorage.getItem("diet_logs")) || [];
let weights = JSON.parse(localStorage.getItem("weight_logs")) || [];
let foodDb = [];
let mChart, wChart;

// Загрузка базы продуктов из внешнего файла
fetch('food_db.json')
    .then(r => r.json())
    .then(data => foodDb = data)
    .catch(e => console.error("Ошибка загрузки базы данных продуктов"));

function initCharts() {
    const mCtx = document.getElementById('macrosChart').getContext('2d');
    mChart = new Chart(mCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, GOALS.cal],
                backgroundColor: ['#4caf50', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: { cutout: '80%', plugins: { legend: false } }
    });

    const wCtx = document.getElementById('weightChart').getContext('2d');
    wChart = new Chart(wCtx, {
        type: 'line',
        data: {
            labels: weights.map(w => w.date),
            datasets: [{
                label: 'Вес',
                data: weights.map(w => w.val),
                borderColor: '#2196f3',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(33, 150, 243, 0.1)'
            }]
        },
        options: { plugins: { legend: false } }
    });
}

// Поиск по базе
document.getElementById('todo-input').oninput = (e) => {
    const val = e.target.value.toLowerCase();
    const sug = document.getElementById('suggestions');
    sug.innerHTML = "";
    
    if(val.length > 1) {
        const matches = foodDb.filter(f => f.n.toLowerCase().includes(val)).slice(0, 5);
        matches.forEach(item => {
            const d = document.createElement('div');
            d.className = 'sug-item';
            d.innerHTML = `<span>${item.n}</span><small>${item.c} ккал</small>`;
            d.onclick = () => {
                document.getElementById('todo-input').value = item.n;
                document.getElementById('cal-input').value = item.c;
                document.getElementById('prot-input').value = item.p;
                sug.innerHTML = "";
            };
            sug.appendChild(d);
        });
    }
};

function logWeight() {
    const val = document.getElementById('weight-input').value;
    const date = new Date().toLocaleDateString('ru-RU', {day:'numeric', month:'short'});
    if(val) {
        weights.push({date, val: parseFloat(val)});
        if(weights.length > 7) weights.shift();
        localStorage.setItem("weight_logs", JSON.stringify(weights));
        wChart.update();
        Swal.fire({ title: 'Вес записан!', icon: 'success', timer: 1000, showConfirmButton: false });
    }
}

function render() {
    let t = { c: 0, p: 0 };
    const list = document.getElementById('todo-list');
    list.innerHTML = "";
    
    todos.forEach((item, index) => {
        t.c += item.c; t.p += item.p;
        const li = document.createElement('li');
        li.innerHTML = `<div><b>${item.n}</b><br><small>${item.c} ккал</small></div>
                        <button class="del-btn" onclick="deleteItem(${index})">×</button>`;
        list.appendChild(li);
    });

    const remCal = Math.max(0, GOALS.cal - t.c);
    document.getElementById('rem-values').innerHTML = `Осталось:<br><b>${remCal}</b> ккал`;
    mChart.data.datasets[0].data = [t.c, remCal];
    mChart.update();
    localStorage.setItem("diet_logs", JSON.stringify(todos));
}

function deleteItem(i) { todos.splice(i, 1); render(); }

document.getElementById('add-btn').onclick = () => {
    const n = document.getElementById('todo-input').value;
    const c = parseInt(document.getElementById('cal-input').value) || 0;
    const p = parseInt(document.getElementById('prot-input').value) || 0;
    if(n && c) {
        todos.push({n, c, p});
        render();
        document.getElementById('todo-input').value = "";
    }
};

window.onload = () => { initCharts(); render(); };