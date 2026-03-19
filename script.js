const GOALS = { cal: 2600, prot: 140 };
let todos = JSON.parse(localStorage.getItem("diet_logs")) || [];
let weights = JSON.parse(localStorage.getItem("weight_logs")) || [];
let foodDb = [];
let mChart, wChart;

// Загрузка базы
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
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: { y: { display: true }, x: { display: true } },
            plugins: { legend: false }
        }
    });
}

// Поиск
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
        if(weights.length > 7) weights.shift(); // Храним только неделю
        localStorage.setItem("weight_logs", JSON.stringify(weights));
        
        // Обновляем график без перезагрузки
        wChart.data.labels = weights.map(w => w.date);
        wChart.data.datasets[0].data = weights.map(w => w.val);
        wChart.update();
        
        document.getElementById('weight-input').value = "";
        Swal.fire({ title: 'Вес записан!', icon: 'success', timer: 1000, showConfirmButton: false });
    }
}

function deleteItem(index) {
    todos.splice(index, 1);
    render();
}

function render() {
    let t = { c: 0, p: 0 };
    const list = document.getElementById('todo-list');
    list.innerHTML = "";
    
    todos.forEach((item, index) => {
        t.c += item.c; t.p += item.p;
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <div style="font-weight:600">${item.n}</div>
                <small style="color:#888">${item.c} ккал | ${item.p}г белка</small>
            </div>
            <button class="del-btn" onclick="deleteItem(${index})"><i class="fas fa-times"></i></button>
        `;
        list.appendChild(li);
    });

    const remCal = Math.max(0, GOALS.cal - t.c);
    const remProt = Math.max(0, GOALS.prot - t.p);

    document.getElementById('rem-values').innerHTML = 
        `Осталось:<br><b>${remCal}</b> ккал<br><b>${remProt}г</b> белка`;
    
    mChart.data.datasets[0].data = [t.c, remCal];
    mChart.update();
    
    localStorage.setItem("diet_logs", JSON.stringify(todos));
}

document.getElementById('add-btn').onclick = () => {
    const n = document.getElementById('todo-input').value;
    const c = parseInt(document.getElementById('cal-input').value) || 0;
    const p = parseInt(document.getElementById('prot-input').value) || 0;
    
    if(n && c) {
        todos.push({n, c, p});
        render();
        document.getElementById('todo-input').value = "";
        document.getElementById('cal-input').value = "";
        document.getElementById('prot-input').value = "";
    }
};

document.getElementById('clear-btn').onclick = () => {
    Swal.fire({
        title: 'Очистить день?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4caf50',
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет'
    }).then((result) => {
        if (result.isConfirmed) {
            todos = [];
            render();
        }
    });
};

// Запуск
window.onload = () => {
    initCharts();
    render();
};