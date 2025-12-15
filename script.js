// script.js

document.addEventListener('DOMContentLoaded', () => {
    const roleTableBody = document.getElementById('roleTableBody');
    const addRoleButton = document.getElementById('addRoleButton');
    const calculateButton = document.getElementById('calculateButton');
    // 🌟 1. コピーボタンの要素を取得
    const copyResultButton = document.getElementById('copyResultButton');


    // --- 役割の動的な追加・削除機能 ---

    let roleIndex = 0; 

    function addRoleRow(roleName = '', weight = 1.0, count = 1) {
        roleIndex++; 
        const finalRoleName = roleName || `hoge${roleIndex}`;
        
        const newRow = roleTableBody.insertRow();
        
        // 役割名
        newRow.insertCell().innerHTML = `<input type="text" class="role-name-input" value="${finalRoleName}">`;
        
        // 重み係数 (初期値 1.0)
        newRow.insertCell().innerHTML = `<input type="number" class="weight-input" value="${weight}" step="0.1" min="0.1">`;
        
        // 人数 (初期値 1)
        newRow.insertCell().innerHTML = `<input type="number" class="count-input" value="${count}" min="1">`;
        
        // 削除ボタン
        const deleteCell = newRow.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-role-button';
        deleteButton.addEventListener('click', () => {
            if (roleTableBody.rows.length > 1) { 
                newRow.remove();
            } else {
                alert("役割は最低1つ必要です。");
            }
        });
        deleteCell.appendChild(deleteButton);
    }

    // 役割追加ボタンのイベントリスナー
    addRoleButton.addEventListener('click', () => {
        addRoleRow();
    });

    // 初期行の追加
    addRoleRow('hoge1', 1.0, 1);


    // --- メインの計算ロジックとコピー機能 ---

    calculateButton.addEventListener('click', calculateSplit);
    
    // 🌟 2. コピーボタンのイベントリスナーを追加
    copyResultButton.addEventListener('click', copyResultsToClipboard);


    // 計算実行関数
    function calculateSplit() {
        // 初期化: 計算エラーまたは未入力の場合に備え、ボタンを非表示にする
        copyResultButton.style.display = 'none';

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
                // データを保存する際に、未定義の支払い額や集金総額のプロパティを初期化
                rolesData.push({
                    name: row.querySelector('.role-name-input').value || '役割名なし',
                    weight: weight,
                    count: count,
                    finalIndividualPayment: 0, // 結果保存用
                });
                totalWeight += weight * count;
            }
        });

        if (totalWeight === 0) {
            resultOutput.innerHTML = `<p style="color: red;">役割と人数を正しく入力してください。</p>`;
            return;
        }

        // 3. 1重みあたりの金額を計算
        const unitPricePerWeight = totalAmount / totalWeight;
        
        let totalCollectedAmount = 0; 
        let resultHTML = '';

        // 4. 各役割の個人の支払額を計算し、切り上げ丸め処理を適用
        rolesData.forEach(role => {
            const tempIndividualPayment = unitPricePerWeight * role.weight;
            const finalIndividualPayment = Math.ceil(tempIndividualPayment / roundUnit) * roundUnit;
            
            // 🌟 結果データを役割オブジェクトに保存
            role.finalIndividualPayment = finalIndividualPayment; 

            totalCollectedAmount += finalIndividualPayment * role.count;

            // D. 結果表示用のHTMLを生成
            resultHTML += `<div class="result-item">
                <strong>${role.name}</strong> (${role.count}人): 1人あたり 
                <span>¥${finalIndividualPayment.toLocaleString()}</span>
                <span style="font-size: 0.9em; color: #6c757d;"> (グループ合計: ¥${(finalIndividualPayment * role.count).toLocaleString()})</span>
            </div>`;
        });

        // 5. 超過額（調整金）の計算と表示
        const excessAmount = totalCollectedAmount - totalAmount;
        
        // 🌟 結果をグローバル/セッションストレージに一時保存 (コピー機能で使用)
        sessionStorage.setItem('calculatedResults', JSON.stringify({
            roles: rolesData,
            totalAmount: totalAmount,
            totalCollectedAmount: totalCollectedAmount,
            excessAmount: excessAmount
        }));
        
        resultHTML += `<hr>
            <p><strong>集金総額 (全員の支払い合計):</strong> ¥${totalCollectedAmount.toLocaleString()}</p>
            <p><strong>元の合計金額:</strong> ¥${totalAmount.toLocaleString()}</p>
            
            <h3>✅ 支払い代表者の調整金: <span>¥${excessAmount.toLocaleString()}</span></h3>
            <p style="font-size: 0.9em; color: #6c757d;">※ この金額は、全員の端数切り上げにより発生したもので、支払い代表者が受け取る超過分です。</p>`;

        resultOutput.innerHTML = resultHTML;
        
        // 🌟 6. 計算成功後、コピーボタンを表示
        copyResultButton.style.display = 'block'; 
    }
    
    
    // 🌟 コピー機能のメインロジック 🌟
    async function copyResultsToClipboard() {
        const resultText = generateResultText(); // 整形されたテキストを取得
        
        try {
            await navigator.clipboard.writeText(resultText);
            alert("計算結果をクリップボードにコピーしました！");
            
            // コピー成功時にボタンのテキストを一時的に変更
            copyResultButton.textContent = 'コピー完了！';
            setTimeout(() => {
                copyResultButton.textContent = '結果をクリップボードにコピー';
            }, 2000);
            
        } catch (err) {
            console.error('クリップボードへのコピーに失敗しました:', err);
            alert("コピーに失敗しました。ブラウザの権限設定を確認してください。");
        }
    }
    
    // 🌟 コピー用のテキストを整形する関数 🌟
    function generateResultText() {
        const data = JSON.parse(sessionStorage.getItem('calculatedResults'));
        if (!data) return "計算結果が見つかりません。先に計算を実行してください。";

        let text = "--- 役割ベース割り勘結果 ---\n\n";
        text += `元の合計金額: ¥${data.totalAmount.toLocaleString()}\n\n`;
        text += "--- 個別支払額 ---\n";

        data.roles.forEach(role => {
            const totalGroupPayment = role.finalIndividualPayment * role.count;
            text += `[${role.name}] ${role.count}人:\n`;
            text += `  1人あたり: ¥${role.finalIndividualPayment.toLocaleString()}\n`;
            text += `  (合計: ¥${totalGroupPayment.toLocaleString()})\n`;
        });

        text += "\n--------------------------\n";
        text += `💰 全員の支払合計: ¥${data.totalCollectedAmount.toLocaleString()}\n`;
        text += `✨ 代表者の調整金: ¥${data.excessAmount.toLocaleString()} (切り上げ分)\n`;
        text += "--------------------------\n";

        return text;
    }

});
