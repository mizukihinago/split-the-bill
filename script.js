// script.js

document.addEventListener('DOMContentLoaded', () => {
    const roleTableBody = document.getElementById('roleTableBody');
    const addRoleButton = document.getElementById('addRoleButton');
    const calculateButton = document.getElementById('calculateButton');
    const copyResultButton = document.getElementById('copyResultButton');

    // 役割インデックスはグローバルに保持
    let roleIndex = 0; 


    // --- 役割の動的な追加・削除機能 ---

    // 役割設定のデータを LocalStorage に保存する関数
    function saveRolesToLocalStorage() {
        const rolesToSave = [];
        document.querySelectorAll('#roleTableBody tr').forEach(row => {
            rolesToSave.push({
                name: row.querySelector('.role-name-input').value.trim(),
                weight: parseFloat(row.querySelector('.weight-input').value),
                count: parseInt(row.querySelector('.count-input').value)
            });
        });
        localStorage.setItem('splitRoles', JSON.stringify(rolesToSave));
    }


    function addRoleRow(roleName = '', weight = 1.0, count = 1, isFromLoad = false) {
        // ロード時以外はインデックスをインクリメントし、デフォルトの 'hoge' 名を生成
        if (!isFromLoad) {
            roleIndex++; 
        }
        // ロード時でroleNameが空の場合、新規行と同じようにhoge番号を割り振る
        const finalRoleName = roleName || `hoge${roleIndex}`;
        
        const newRow = roleTableBody.insertRow();
        
        // 役割名 (入力変更時に自動保存をトリガー)
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'role-name-input';
        nameInput.value = finalRoleName;
        nameInput.addEventListener('change', saveRolesToLocalStorage); // 変更時に保存
        newRow.insertCell().appendChild(nameInput);
        
        // 重み係数 (入力変更時に自動保存をトリガー)
        const weightInput = document.createElement('input');
        weightInput.type = 'number';
        weightInput.className = 'weight-input';
        weightInput.value = weight;
        weightInput.step = '0.1';
        weightInput.min = '0.1';
        weightInput.addEventListener('change', saveRolesToLocalStorage); //変更時に保存
        newRow.insertCell().appendChild(weightInput);
        
        // 人数 (入力変更時に自動保存をトリガー)
        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.className = 'count-input';
        countInput.value = count;
        countInput.min = '1';
        countInput.addEventListener('change', saveRolesToLocalStorage); //変更時に保存
        newRow.insertCell().appendChild(countInput);
        
        // 削除ボタン
        const deleteCell = newRow.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-role-button';
        deleteButton.addEventListener('click', () => {
            if (roleTableBody.rows.length > 1) { 
                newRow.remove();
                saveRolesToLocalStorage(); //削除時に保存
            } else {
                alert("役割は最低1つ必要です。");
            }
        });
        deleteCell.appendChild(deleteButton);
    }

    // 役割追加ボタンのイベントリスナー
    addRoleButton.addEventListener('click', () => {
        addRoleRow();
        saveRolesToLocalStorage(); //追加時に保存
    });

    // 役割設定のデータを LocalStorage から読み込む関数
    function loadRolesFromLocalStorage() {
        const savedRolesJSON = localStorage.getItem('splitRoles');
        if (savedRolesJSON) {
            try {
                const savedRoles = JSON.parse(savedRolesJSON);
                if (savedRoles.length > 0) {
                    // 初期行をクリア
                    roleTableBody.innerHTML = '';
                    
                    // 役割インデックスをリセット
                    roleIndex = 0;
                    
                    savedRoles.forEach((role, index) => {
                        // ロード時は index + 1 を使用して、hoge番号を生成する基にする
                        roleIndex = index + 1; 
                        addRoleRow(role.name, role.weight, role.count, true); 
                    });
                    return;
                }
            } catch (e) {
                console.error("LocalStorageからの読み込みに失敗しました:", e);
                // 失敗した場合は、下記のデフォルト処理へ
            }
        }
        // データがない、または読み込み失敗した場合のデフォルト初期行
        addRoleRow('hoge1', 1.0, 1);
        roleIndex = 1; // hoge1 のため
    }

    // アプリ起動時に役割設定を読み込む
    loadRolesFromLocalStorage();


    // --- メインの計算ロジックとコピー機能 ---

    calculateButton.addEventListener('click', calculateSplit);
    copyResultButton.addEventListener('click', copyResultsToClipboard);


    // 計算実行関数
    function calculateSplit() {
        //計算実行時にも保存し、次回起動時にも最新のデータが残るようにする
        saveRolesToLocalStorage(); 
        
        copyResultButton.style.display = 'none';

        // 1. 全体設定の取得
        const totalAmount = parseFloat(document.getElementById('totalAmount').value);
        const roundUnit = parseInt(document.getElementById('roundUnit').value);
        const resultOutput = document.getElementById('resultOutput');
        
        let totalWeight = 0;
        const rolesData = [];
        let validationError = null; 

        // 1. 全体設定の検証
        if (isNaN(totalAmount) || totalAmount <= 0) {
            validationError = "合計金額に有効な金額を入力してください。";
        }
        
        if (!validationError) {
            // 2. 役割データの検証と収集
            document.querySelectorAll('#roleTableBody tr').forEach(row => {
                const name = row.querySelector('.role-name-input').value.trim();
                const weight = parseFloat(row.querySelector('.weight-input').value);
                const count = parseInt(row.querySelector('.count-input').value);

                if (!name) {
                    validationError = "役割名が空欄の行があります。入力してください。";
                }
                if (isNaN(weight) || weight < 0.1) {
                    validationError = "重みに0.1以上の有効な数値を入力してください。";
                }
                if (isNaN(count) || count < 1) {
                    validationError = "人数に1以上の有効な数値を入力してください。";
                }
                
                if (validationError) return; 
                
                rolesData.push({
                    name: name,
                    weight: weight,
                    count: count,
                    finalIndividualPayment: 0,
                });
                totalWeight += weight * count;
            });
        }
        
        // 3. 検証結果の判定
        if (validationError) {
            resultOutput.innerHTML = `<p style="color: red;">⚠️ ${validationError}</p>`;
            return;
        }

        if (totalWeight === 0) {
             resultOutput.innerHTML = `<p style="color: red;">役割と人数を正しく入力してください（重みの合計が0です）。</p>`;
             return;
        }


        // (以下、計算ロジック本体)
        
        // 1重みあたりの金額を計算
        const unitPricePerWeight = totalAmount / totalWeight;
        
        let totalCollectedAmount = 0; 
        let resultHTML = '';

        // 各役割の個人の支払額を計算し、切り上げ丸め処理を適用
        rolesData.forEach(role => {
            const tempIndividualPayment = unitPricePerWeight * role.weight;
            const finalIndividualPayment = Math.ceil(tempIndividualPayment / roundUnit) * roundUnit;
            
            role.finalIndividualPayment = finalIndividualPayment; 

            totalCollectedAmount += finalIndividualPayment * role.count;

            // 結果表示用のHTMLを生成
            resultHTML += `<div class="result-item">
                <strong>${role.name}</strong> (${role.count}人): 1人あたり 
                <span>¥${finalIndividualPayment.toLocaleString()}</span>
                <span style="font-size: 0.9em; color: #6c757d;"> (グループ合計: ¥${(finalIndividualPayment * role.count).toLocaleString()})</span>
            </div>`;
        });

        // 超過額（調整金）の計算と表示
        const excessAmount = totalCollectedAmount - totalAmount;
        
        // セッションストレージに結果を一時保存 (コピー機能で使用)
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
        
        // 計算成功後、コピーボタンを表示
        copyResultButton.style.display = 'block'; 
    }
    
    
    //コピー機能のメインロジック
    async function copyResultsToClipboard() {
        const resultText = generateResultText(); 
        
        try {
            await navigator.clipboard.writeText(resultText);
            alert("計算結果をクリップボードにコピーしました！");
            
            copyResultButton.textContent = 'コピー完了！';
            setTimeout(() => {
                copyResultButton.textContent = '結果をクリップボードにコピー';
            }, 2000);
            
        } catch (err) {
            console.error('クリップボードへのコピーに失敗しました:', err);
            alert("コピーに失敗しました。ブラウザの権限設定を確認してください。");
        }
    }
    
    // コピー用のテキストを整形する関数
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
        text += `全員の支払合計: ¥${data.totalCollectedAmount.toLocaleString()}\n`;
        text += `代表者の調整金: ¥${data.excessAmount.toLocaleString()} (切り上げ分)\n`;
        text += "--------------------------\n";

        return text;
    }

});
