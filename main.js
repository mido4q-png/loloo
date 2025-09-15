(function(){
    const expressionEl = document.getElementById('expression');
    const resultEl = document.getElementById('result');
    const keys = document.getElementById('keys');

    let expression = '';

    function updateDisplay(){
      expressionEl.textContent = expression || '0';
      try{
        const val = evaluateSafe(expression);
        resultEl.textContent = (val !== undefined && !isNaN(val)) ? formatNumber(val) : '0';
      }catch(e){ resultEl.textContent = val}
    }

    function formatNumber(n){
      // avoid scientific for reasonably sized numbers
      if(!isFinite(n)) return String(n);
      const s = String(n);
      return s.length > 14 ? Number(n).toPrecision(12) : s;
    }

    function append(char){
      // prevent multiple leading zeros
      if(expression === '0' && /\d/.test(char)) expression = char;
      else expression += char;
      updateDisplay();
    }

    function clearAll(){ expression = ''; updateDisplay(); }
    function backspace(){ expression = expression.slice(0,-1); updateDisplay(); }

    function safeOp(op){
      if(!expression) return;
      // replace trailing operator
      expression = expression.replace(/[+\-×÷/]$/, '');
      expression += op;
      updateDisplay();
    }

    function percent(){
      try{
        const val = evaluateSafe(expression);
        if(isFinite(val)){
          expression = String(val/100);
          updateDisplay();
        }
      }catch(e){}
    }

    function equals(){
      try{
        const val = evaluateSafe(expression);
        expression = String(val);
        updateDisplay();
      }catch(e){ resultEl.textContent = 'Error' }
    }

    // very small parser that translates × ÷ to * / and evaluates safely
    function evaluateSafe(expr){
      if(!expr) return 0;
      // disallow letters or other unsafe chars
      if(/[A-Za-z]/.test(expr)) throw new Error('Invalid');
      const sanitized = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/–/g,'-');
      // prevent sequences of operators like ++ or **
      if(/[^0-9.)]\s*[+\-*/]{2,}/.test(sanitized)) throw new Error('Invalid');
      // avoid starting with operator except -
      if(/^[+*/]/.test(sanitized)) throw new Error('Invalid');
      // evaluate using Function (limited) — inputs are sanitized above
      // note: this is simple and not for untrusted user content on servers
      // but fine for a local calculator in the browser
      // also limit length
      if(sanitized.length > 200) throw new Error('Too long');
      // eslint-disable-next-line no-new-func
      const fn = new Function('return ' + sanitized);
      const out = fn();
      return out;
    }

    // handle clicks
    keys.addEventListener('click', e => {
      const t = e.target;
      if(t.matches('[data-num]')) append(t.textContent);
      if(t.matches('[data-dot]')) append('.');
      if(t.matches('[data-action]')){
        const a = t.getAttribute('data-action');
        if(a === 'clear') clearAll();
        if(a === 'back') backspace();
        if(a === 'percent') percent();
        if(a === 'equals') equals();
        if(a === 'op') safeOp(t.textContent.trim());
      }
    });

    // keyboard support
    window.addEventListener('keydown', e => {
      if(e.key >= '0' && e.key <= '9') { append(e.key); e.preventDefault(); }
      if(e.key === '.') { append('.'); e.preventDefault(); }
      if(e.key === 'Backspace') { backspace(); e.preventDefault(); }
      if(e.key === 'Escape') { clearAll(); e.preventDefault(); }
      if(e.key === 'Enter' || e.key === '=') { equals(); e.preventDefault(); }
      if(['+','-','/','*'].includes(e.key)){
        const map = {'/':'÷','*':'×'};
        safeOp(map[e.key] || e.key);
        e.preventDefault();
      }
      if(e.key === '%') { percent(); e.preventDefault(); }
    });

    // init
    clearAll();
  })();