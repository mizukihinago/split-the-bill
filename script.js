// script.js

document.addEventListener('DOMContentLoaded', () => {
    const roleTableBody = document.getElementById('roleTableBody');
    const addRoleButton = document.getElementById('addRoleButton');
    const calculateButton = document.getElementById('calculateButton');

    // --- 役割の動的な追加・削除機能 ---

    // 新しい役割行を追加する関数
    function addRoleRow(roleName = '', weight = 1.0, count = 1) {
        const newRow = roleTableBody.insertRow();
        
        // 役割名
        newRow.insertCell().innerHTML = `<input type="text" class="role-name-input" value="${roleName}">`;
        
        // 重み係数 (0.1刻みで変更可能)
        newRow.insertCell().innerHTML = `<input type="number" class="weight-input" value="${weight}" step="0.1" min="0.1">`;
        
        // 人数
        newRow.insertCell().innerHTML = `<input type="number" class="count-input" value="${count}" min="1">`;
        
        // 削除ボタン
        const deleteCell = newRow.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-role-button';
        deleteButton.addEventListener('click', () => {
            if (roleTableBody.rows.length > 1) { // 最後の1行は削除不可とする
                newRow.remove();
            } else {
                alert("役割は最低1つ必要です。");
            }
        });
        deleteCell.appendChild(deleteButton);
    }

    // 役割追加ボタンのイベントリスナー
    addRoleButton.addEventListener('click', () => {
        addRoleRow('', 1.0, 1);
    });

    // 初期行の追加 (アプリ起動時に表示される役割)
    addRoleRow('一般 (基準)', 1.0, 3);
    addRoleRow('幹事 (代表者)', 1.2, 1);


    // --- メインの計算ロジック ---

    calculateButton.addEventListener('click', calculateSplit);

    function calculateSplit() {
        // 1. 全体設定の取得
        const totalAmount = parseFloat(document.getElementById('totalAmount').value);
        const roundUnit = parseInt(document.getElementById('roundUnit').value);
        const resultOutput = document.getElementById('resultOutput');

        if (isNaN(totalAmount) || totalAmount <= 0) {
            resultOutput.innerHTML = `<p style="color: red;">有効な合計金額を入力してください。</p>`;
            return;
        }

        // 2. 役割データ（Roles）の収集と総重みの計算
        let totalWeight = 0;
        const rolesData = [];

        document.querySelectorAll('#roleTableBody tr').forEach(row => {
            const weight = parseFloat(row.querySelector('.weight-input').value);
            const count = parseInt(row.querySelector('.count-input').value);
            
            if (weight > 0 && count > 0) {
                rolesData.push({
                    name: row.querySelector('.role-name-input').value || '役割名なし',
                    weight: weight,
                    count: count
                });
                totalWeight += weight * count;
            }
        });

        if (totalWeight === 0) {
            resultOutput.innerHTML = `<p style="color: red;">役割と人数を正しく入力してください。</p>`;
            return;
        }

        // 3. 1重みあたりの金額を計算
        // 浮動小数点誤差を避けるため、一旦金額を整数（セントなど）に変換する処理を念頭に置くが、ここではシンプルに計算
        const unitPricePerWeight = totalAmount / totalWeight;
        
        let totalCollectedAmount = 0; // 集金総額
        let resultHTML = '';

        // 4. 各役割の個人の支払額を計算し、切り上げ丸め処理を適用
        rolesData.forEach(role => {
            // A. 個人の仮支払額 (例: 2380.95238...)
            const tempIndividualPayment = unitPricePerWeight * role.weight;

            // B. 指定単位で切り上げ（例: 100円単位）
            // Math.ceil(仮支払額 / 丸め単位) * 丸め単位
            const finalIndividualPayment = Math.ceil(tempIndividualPayment / roundUnit) * roundUnit;

            // C. 集金総額を更新
            totalCollectedAmount += finalIndividualPayment * role.count;

            // D. 結果表示用のHTMLを生成
            resultHTML += `<div class="result-item">
                <strong>${role.name}</strong> (${role.count}人): 1人あたり 
                <span>¥${finalIndividualPayment.toLocaleString()}</span>
                <span style="font-size: 0.9em; color: #6c757d;"> (合計: ¥${(finalIndividualPayment * role.count).toLocaleString()})</span>
            </div>`;
        });

        // 5. 超過額（調整金）の計算と表示
        const excessAmount = totalCollectedAmount - totalAmount;

        resultHTML += `<hr>
            <p><strong>集金総額 (全員の支払い合計):</strong> ¥${totalCollectedAmount.toLocaleString()}</p>
            <p><strong>元の合計金額:</strong> ¥${totalAmount.toLocaleString()}</p>
            
            <h3>✅ 支払い代表者の調整金: <span>¥${excessAmount.toLocaleString()}</span></h3>
            <p style="font-size: 0.9em; color: #6c757d;">※ この金額は、全員の端数切り上げにより発生したもので、支払い代表者が受け取る超過分です。</p>`;

        resultOutput.innerHTML = resultHTML;
    }

});
