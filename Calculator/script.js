document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const calculator = document.getElementById('calculator');
    const displayCurr = document.getElementById('curr-operand');
    const displayPrev = document.getElementById('prev-operand');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    
    // Toggles
    const toggleHistoryTab = document.getElementById('toggle-history-tab');
    const toggleHistoryNav = document.getElementById('nav-history');
    const closeHistoryMobile = document.getElementById('close-history-mobile');
    const toggleScientificBtn = document.getElementById('toggle-scientific');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const angleToggle = document.getElementById('angle-toggle');
    const degLabel = document.getElementById('deg-label');
    const radLabel = document.getElementById('rad-label');
    
    // Modals
    const settingsModal = document.getElementById('settings-modal');
    const aboutModal = document.getElementById('about-modal');
    const settingsBtn = document.getElementById('nav-settings');
    const aboutBtn = document.getElementById('about-btn');
    const closeModals = document.querySelectorAll('.close-modal');
    
    // Settings Selects
    const themeSelect = document.getElementById('theme-select');
    const modeSelect = document.getElementById('mode-select');

    // State Variables
    let equation = "";
    let previousEquation = "";
    let isRadian = false; // default is DEG, matches active class
    let history = JSON.parse(localStorage.getItem('calc-history')) || [];
    let isResultDisplayed = false;

    // Output formatting
    const formatNumber = (str) => {
        if (!str) return '';
        const parts = str.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const formatEquation = (eq) => {
        // Find numbers and format them with commas, keeping operators intact
        return eq.replace(/\d+(?:\.\d+)?/g, (match) => {
            return formatNumber(match);
        });
    };

    const updateDisplay = () => {
        displayCurr.textContent = equation === "" ? "0" : formatEquation(equation);
        displayPrev.textContent = previousEquation !== "" ? formatEquation(previousEquation) + " =" : "";
        
        // Dynamic font sizing for long numbers
        if (displayCurr.textContent.length > 12) {
            displayCurr.style.fontSize = '2.5rem';
        } else if (displayCurr.textContent.length > 8) {
            displayCurr.style.fontSize = '3rem';
        } else {
            displayCurr.style.fontSize = '3.5rem';
        }
    };

    // Number Handling
    const appendNumber = (num) => {
        if (isResultDisplayed) {
            equation = num;
            previousEquation = "";
            isResultDisplayed = false;
        } else {
            if (equation === "0" && num !== ".") equation = num;
            else equation += num;
        }
        updateDisplay();
    };

    // Action Handling
    const appendAction = (action) => {
        if (isResultDisplayed && !['clear', 'delete', 'calculate'].includes(action)) {
            isResultDisplayed = false;
            // Continuing calculation with previous result
            previousEquation = "";
        }

        const lastCharStr = equation.trim().slice(-1);

        switch(action) {
            case 'clear':
                equation = "";
                previousEquation = "";
                isResultDisplayed = false;
                break;
            case 'delete':
                if (isResultDisplayed) {
                    equation = "";
                    previousEquation = "";
                    isResultDisplayed = false;
                } else if (equation.length > 0) {
                    // Smart delete for functions
                    if (equation.endsWith("sin(") || equation.endsWith("cos(") || 
                        equation.endsWith("tan(") || equation.endsWith("log(") || 
                        equation.endsWith("log(") || equation.endsWith("ln(")) {
                        equation = equation.slice(0, -4);
                    } else if (equation.endsWith("√(")) {
                        equation = equation.slice(0, -2);
                    } else if (equation.endsWith(" ")) {
                        // Deleting an operator like ' + '
                        equation = equation.slice(0, -3);
                    } else {
                        equation = equation.slice(0, -1);
                    }
                }
                break;
            case '+':
            case '-':
            case '*':
            case '/':
            case '^':
                if (equation === "") {
                    if (action === '-') equation += "-";
                } else {
                    const mappedOps = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
                    const op = mappedOps[action];
                    
                    // Replace last operator if already exists
                    if (['+', '−', '×', '÷', '^'].includes(lastCharStr)) {
                        equation = equation.slice(0, -3) + ` ${op} `;
                    } else {
                        equation += ` ${op} `;
                    }
                }
                break;
            case 'decimal':
                // Check if last number already has a decimal
                const words = equation.split(' ');
                const lastWord = words[words.length - 1];
                if (!lastWord.includes('.')) {
                    if (lastWord === "" || lastWord === "(") {
                        equation += "0.";
                    } else {
                        equation += ".";
                    }
                }
                break;
            case 'mod':
                equation += "%";
                break;
            case '()':
                // Count open and close
                const openCount = (equation.match(/\(/g) || []).length;
                const closeCount = (equation.match(/\)/g) || []).length;
                if (openCount > closeCount && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                    equation += ")";
                } else {
                    if (equation !== "" && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                         equation += " × ";
                    }
                    equation += "(";
                }
                break;
            case 'inv':
                if (equation !== "" && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                    equation += "^-1";
                }
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case 'sqrt':
                const fnMap = { 'sqrt': '√' };
                const prefix = fnMap[action] || action;
                if (equation !== "" && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                    equation += ` × ${prefix}(`;
                } else {
                    equation += `${prefix}(`;
                }
                break;
            case 'pi':
                if (equation !== "" && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                    equation += " × π";
                } else {
                    equation += "π";
                }
                break;
            case 'e':
                if (equation !== "" && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                     equation += " × e";
                } else {
                    equation += "e";
                }
                break;
            case 'pow':
                if (equation !== "" && !['+', '−', '×', '÷', '^'].includes(lastCharStr)) {
                    equation += " ^ ";
                }
                break;
            case 'fact':
                if (equation !== "" && !['+', '−', '×', '÷', '^', ' ', '('].includes(lastCharStr)) {
                    equation += "!";
                }
                break;
            case 'calculate':
                calculateResult();
                break;
        }
        updateDisplay();
    };

    // Math Functions for evaluation scope
    const _sin = (val) => isRadian ? Math.sin(val) : Math.sin(val * Math.PI / 180);
    const _cos = (val) => isRadian ? Math.cos(val) : Math.cos(val * Math.PI / 180);
    const _tan = (val) => isRadian ? Math.tan(val) : Math.tan(val * Math.PI / 180);
    const _fact = (n) => {
        if (n < 0 || n % 1 !== 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let p = 1;
        for (let i = 2; i <= n; i++) p *= i;
        return p;
    };

    const calculateResult = () => {
        if (!equation) return;
        
        let evalStr = equation;
        
        // Auto close parens
        const openCount = (evalStr.match(/\(/g) || []).length;
        const closeCount = (evalStr.match(/\)/g) || []).length;
        for (let i = 0; i < openCount - closeCount; i++) evalStr += ")";

        const origStr = evalStr; // for history

        // Prepare string for JS execution
        evalStr = evalStr.replace(/×/g, '*')
                         .replace(/÷/g, '/')
                         .replace(/−/g, '-')
                         .replace(/π/g, 'Math.PI')
                         .replace(/e/g, 'Math.E')
                         .replace(/sin\(/g, '_sin(')
                         .replace(/cos\(/g, '_cos(')
                         .replace(/tan\(/g, '_tan(')
                         .replace(/log\(/g, 'Math.log10(')
                         .replace(/ln\(/g, 'Math.log(')
                         .replace(/√\(/g, 'Math.sqrt(')
                         .replace(/\^/g, '**');

        // Percentages
        evalStr = evalStr.replace(/%/g, '/100');

        // Factorial (matches numbers and variables)
        evalStr = evalStr.replace(/(\d+(?:\.\d+)?)!/g, '_fact($1)');

        try {
            // Evaluator with safe scoped variables
            const fn = new Function('_sin', '_cos', '_tan', '_fact', 'return ' + evalStr);
            let result = fn(_sin, _cos, _tan, _fact);

            if (!isFinite(result) || isNaN(result)) {
                throw new Error("Math Error");
            }

            // Strip floating point errors (e.g. 0.1+0.2=0.30000000000000004)
            result = parseFloat(result.toPrecision(12)).toString();

            // Save to history
            addHistory(origStr, result);

            previousEquation = origStr;
            equation = result;
            isResultDisplayed = true;

        } catch (error) {
            previousEquation = equation;
            equation = "Error";
            isResultDisplayed = true;
        }
    };

    // Button Listeners
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.number) appendNumber(btn.dataset.number);
            else if (btn.dataset.action) appendAction(btn.dataset.action);
        });
    });

    document.querySelectorAll('.btn-secondary, .btn-primary, .btn-equals, .fn-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.action) appendAction(btn.dataset.action);
        });
    });

    // Angle Toggle (DEG/RAD)
    angleToggle.addEventListener('click', () => {
        isRadian = !isRadian;
        if (isRadian) {
            radLabel.classList.add('active');
            degLabel.classList.remove('active');
        } else {
            degLabel.classList.add('active');
            radLabel.classList.remove('active');
        }
    });

    // History System
    const renderHistory = () => {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No history yet</div>';
            return;
        }

        // Render from newest to oldest
        [...history].reverse().forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="hi-expr">${formatEquation(item.expr)}</div>
                <div class="hi-res">${formatEquation(item.res)}</div>
            `;
            div.addEventListener('click', () => {
                equation = item.res; // Retrieve result to main display
                isResultDisplayed = false;
                updateDisplay();
                // On mobile, close history after selection
                if (window.innerWidth <= 600) {
                    historyPanel.classList.remove('active');
                }
            });
            historyList.appendChild(div);
        });
    };

    const addHistory = (expr, res) => {
        history.push({ expr, res });
        if (history.length > 20) history.shift(); // keep last 20
        localStorage.setItem('calc-history', JSON.stringify(history));
        renderHistory();
    };

    document.getElementById('clear-history').addEventListener('click', () => {
        history = [];
        localStorage.setItem('calc-history', JSON.stringify(history));
        renderHistory();
    });

    // History UI Toggles
    const toggleHistory = () => {
        historyPanel.classList.toggle('active');
        toggleHistoryTab.classList.toggle('active');
    };
    toggleHistoryTab.addEventListener('click', toggleHistory);
    toggleHistoryNav.addEventListener('click', toggleHistory);
    closeHistoryMobile.addEventListener('click', () => {
        historyPanel.classList.remove('active');
        toggleHistoryTab.classList.remove('active');
    });

    // Scientific Mode Toggle
    const toggleScientific = (forceClose = false) => {
        if (forceClose) {
            calculator.classList.remove('scientific-mode');
            toggleScientificBtn.classList.remove('active');
        } else {
            calculator.classList.toggle('scientific-mode');
            toggleScientificBtn.classList.toggle('active');
        }
    };
    toggleScientificBtn.addEventListener('click', () => toggleScientific(false));

    // Theme Management
    const applyTheme = (themeName) => {
        document.body.className = themeName;
        themeSelect.value = themeName;
        localStorage.setItem('calc-theme', themeName);
        
        // Update Theme Icon
        if (themeName === 'theme-light') {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('theme-dark');
        applyTheme(isDark ? 'theme-light' : 'theme-dark');
    });

    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Mode Management (from settings)
    modeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (mode === 'scientific') {
            calculator.classList.add('scientific-mode');
            toggleScientificBtn.classList.add('active');
        } else {
            calculator.classList.remove('scientific-mode');
            toggleScientificBtn.classList.remove('active');
        }
        localStorage.setItem('calc-mode', mode);
    });

    // Modals
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('overlay-hidden'));
    aboutBtn.addEventListener('click', () => aboutModal.classList.remove('overlay-hidden'));
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsModal.classList.add('overlay-hidden');
            aboutModal.classList.add('overlay-hidden');
        });
    });

    // Close Modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.add('overlay-hidden');
        if (e.target === aboutModal) aboutModal.classList.add('overlay-hidden');
    });

    // Initialization
    const initApp = () => {
        const savedTheme = localStorage.getItem('calc-theme') || 'theme-dark';
        applyTheme(savedTheme);
        
        const savedMode = localStorage.getItem('calc-mode');
        if (savedMode) {
            modeSelect.value = savedMode;
            if (savedMode === 'scientific') toggleScientific(false);
        }

        renderHistory();
        updateDisplay();
    };

    initApp();
});
