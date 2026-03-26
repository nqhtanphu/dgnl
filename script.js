document.addEventListener('DOMContentLoaded', () => { 
    const sbdInput = document.getElementById('sbdInput');
    const cccdInput = document.getElementById('cccdInput');
    const emailInput = document.getElementById('emailInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    let studentData = [];
    function normalizeKey(key) {
        return key.trim().replace(/\s+/g, ' ').toLowerCase();
    }

    function isValidScore(score) {
        if (!score || score === '') return false;
        if (typeof score === 'string') {
            if (score.toUpperCase().includes('VẮNG') || score.toUpperCase().includes('N/V')) return false;
            const normalized = score.replace(',', '.');
            return !isNaN(parseFloat(normalized));
        }
        return !isNaN(parseFloat(score));
    }

    function parseScore(score) {
        if (!score || score === '') return null;
        if (typeof score === 'string') {
            if (score.toUpperCase().includes('VẮNG') || score.toUpperCase().includes('N/V')) return 'N/V';
            const normalized = score.replace(',', '.');
            const num = parseFloat(normalized);
            return isNaN(num) ? score : num;
        }
        return parseFloat(score);
    }

    function calculateTotalScore(student) {
        let total = 0;
        const subjects = ['TIẾNG VIỆT', 'TIẾNG ANH', 'TOÁN HỌC', 'LOGIC-PTSL', 'HÓA HỌC', 'VẬT LÝ', 'SINH HỌC','ĐỊA LÝ','LỊCH SỬ','KTPL'];
        subjects.forEach(sub => {
            const score = student[sub];
            if (isValidScore(score)) total += parseScore(score);
        });
        return total;
    }

    function parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
const delimiter = lines[0].includes(';') ? ';' : ',';
const headers = lines[0].split(delimiter).map(h => h.trim());
        const students = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = [];
            let current = '', inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === delimiter && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            if (values.length === headers.length) {
                const student = {};
                headers.forEach((h, idx) => {
                    const key = h.trim().replace(/\s+$/, '');
                    student[key] = values[idx];
                });

                ['TIẾNG VIỆT ', 'TIẾNG ANH ', 'TOÁN '].forEach(subject => {
                    const trimmed = subject.trim();
                    if (student[subject]) {
                        student[trimmed] = parseScore(student[subject]);
                    }
                });

                ['LOGIC-PTSL', 'HÓA HỌC', 'VẬT LÝ'].forEach(sub => { 
                    if (student[sub]) student[sub] = parseScore(student[sub]);
                });

                student['Tổng điểm'] = calculateTotalScore(student);
                students.push(student);
            }
        }
        return students;
    }

    async function loadStudentData() {
        try {
            const response = await fetch('diem_thi.csv');
            const text = await response.text();
            studentData = parseCSV(text);
        } catch (e) {
            resultContainer.innerHTML = '<p style="color:red;">Không thể tải dữ liệu.</p>';
        }
    }

    function findStudentBySBD(sbd) {
        return studentData.find(std => String(std['SBD']).trim() === sbd);
    }

    searchBtn.addEventListener('click', async () => {
    const sbd = sbdInput.value.trim();
    const cccd = cccdInput.value.trim();
    const email = emailInput.value.trim();

    // Kiểm tra nhập đủ
    if (!sbd || !cccd || !email) {
        resultContainer.innerHTML = '<p style="color:red;">Vui lòng nhập đầy đủ thông tin.</p>';
        return;
    }

    // Kiểm tra CCCD 12 số
    if (!/^\d{12}$/.test(cccd)) {
        resultContainer.innerHTML = '<p style="color:red;">CCCD phải gồm 12 số!</p>';
        return;
    }

    // 👉 LƯU DỮ LIỆU (QUAN TRỌNG)
    // Gửi dữ liệu lên Google Sheet
fetch("https://script.google.com/macros/s/AKfycbwzow93A_m3BP9mFO6lZFWQkauEVSbmf93xbdtuWa_4HAyeanJZLEXtsIczS1U8ycAl/exec", {
    method: "POST",
    headers: {
        "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
        sbd: sbd,
        cccd: cccd,
        email: email
    })
})
.then(res => res.text())
.then(data => console.log("Saved:", data))
.catch(err => console.error("Error:", err));
    // Load dữ liệu nếu chưa có
    if (studentData.length === 0) await loadStudentData();

    // ❗ CHỈ TRA CỨU BẰNG SBD
    const student = findStudentBySBD(sbd);

    if (!student) {
        resultContainer.innerHTML = `<p style="color:orange;">Không tìm thấy SBD <strong>${sbd}</strong></p>`;
    } else {
        displayStudent(student);
    }
        // const sbd = sbdInput.value.trim();
        // if (!sbd) {
        //     resultContainer.innerHTML = '<p style="color:red;">Vui lòng nhập SBD.</p>';
        //     return;
        // }

        // if (studentData.length === 0) await loadStudentData();

        // const student = findStudentBySBD(sbd);
        // if (!student) {
        //     resultContainer.innerHTML = `<p style="color:orange;">Không tìm thấy SBD <strong>${sbd}</strong></p>`;
        // } else {
        //     displayStudent(student);
        // }
    });
    function displayStudent(data) {
        const infoFields = ['SBD', 'HỌ VÀ TÊN','NGÀY SINH',];
    const scoreFields = [
        {key: 'TIẾNG VIỆT', max: 300},
        {key: 'TIẾNG ANH', max: 300},
        {key: 'TOÁN HỌC', max: 300},
        {key: 'LOGIC-PTSL', max: 120},
        {key: 'HÓA HỌC', max: 30},
        {key: 'VẬT LÝ', max: 30},
        {key: 'SINH HỌC', max: 30},
        {key: 'ĐỊA LÝ', max: 30},
        {key: 'LỊCH SỬ', max:30},
        {key: 'KTPL', max: 30}
    ];

    let html = `
    <div class="score-report">
        <div class="score-report-header">
            <h2>KẾT QUẢ THI</h2>
        </div>
        
     <div class="student-info-box">
 ${infoFields.map(f => data[f] ? `<p><strong>${f}:</strong> ${data[f]}</p>` : '').join('')}
    <p>
        <strong>GHI CHÚ:</strong> ${data['GHI CHÚ'] || ''}
    </p>
</div>
        <div class="score-bars">
    `;

    let tong = 0;
    scoreFields.forEach(sf => {
        const diem = parseFloat(data[sf.key]) || 0;
        tong += diem;
        const width = Math.min((diem / sf.max) * 100, 100);
        html += `
            <div class="score-item">
                <span>${sf.key}</span>
                <div class="score-bar">
                    <div class="score-bar-fill" style="width:${width}%">${diem}</div>
                </div>
                <span>${sf.max}</span>
            </div>
        `;
    });

    html += `
        </div>
        <div class="total-score">
            TỔNG ĐIỂM <br><span>${tong}</span>
        </div>
    </div>
    `;

    resultContainer.innerHTML = html;
        // const infoFields = ['SBD', 'HỌ VÀ TÊN', 'NGÀY THÁNG NĂM SINH', 'GIỚI TÍNH'];
        // const scoreFields = ['TIẾNG VIỆT', 'TIẾNG ANH', 'TOÁN HỌC','LOGIC-PTSL', 'HÓA HỌC', 'VẬT LÝ','SINH HỌC','ĐỊA LÝ','LỊCH SỬ','KTPL']; // Removed 'Tổng điểm', ĐÂY LÀ NƠI THÊM CỘT ĐIỂM

        // let html = `
        // <div class="student-info">
        //     <h2>Thông tin học sinh</h2>
        //     <table class="info-table"><tbody>`;

        // infoFields.forEach(f => {
        //     if (data[f]) html += `<tr><th>${f}:</th><td>${data[f]}</td></tr>`;
        // });

        // html += `</tbody></table></div><div class="score-info"><h2>Kết quả điểm</h2><table class="score-table"><thead><tr>`;

        // scoreFields.forEach(f => html += `<th>${f}</th>`);
        // html += `</tr></thead><tbody><tr>`;
        // scoreFields.forEach(f => html += `<td>${data[f] !== undefined ? data[f] : '-'}</td>`);
        // html += `</tr></tbody></table></div>`;
        // html += `</div>`;
        // resultContainer.innerHTML = html;
    }
    

    loadStudentData(); // preload

});

