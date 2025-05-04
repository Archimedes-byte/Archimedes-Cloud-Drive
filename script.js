document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const usernameInput = document.getElementById('username');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const verificationInput = document.getElementById('verification');
    const agreementCheckbox = document.getElementById('agreement');
    const registerButton = document.querySelector('.register-btn');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const getCodeButton = document.querySelector('.get-code-btn');
    
    // 密码可见性切换
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('ri-eye-off-line');
                this.classList.add('ri-eye-line');
            } else {
                input.type = 'password';
                this.classList.remove('ri-eye-line');
                this.classList.add('ri-eye-off-line');
            }
        });
    });
    
    // 表单验证
    function validateForm() {
        const isUsernameValid = usernameInput.value.trim().length > 0;
        const isPhoneValid = /^1[3-9]\d{9}$/.test(phoneInput.value.trim());
        const isPasswordValid = passwordInput.value.length >= 8 && passwordInput.value.length <= 20;
        const isConfirmPasswordValid = passwordInput.value === confirmPasswordInput.value;
        const isVerificationValid = verificationInput.value.trim().length > 0;
        const isAgreementChecked = agreementCheckbox.checked;
        
        // 启用或禁用注册按钮
        registerButton.disabled = !(
            isUsernameValid && 
            isPhoneValid && 
            isPasswordValid && 
            isConfirmPasswordValid && 
            isVerificationValid && 
            isAgreementChecked
        );
        
        // 为输入框添加验证样式
        applyValidationStyle(usernameInput, isUsernameValid);
        applyValidationStyle(phoneInput, isPhoneValid);
        applyValidationStyle(passwordInput, isPasswordValid);
        applyValidationStyle(confirmPasswordInput, isConfirmPasswordValid);
        applyValidationStyle(verificationInput, isVerificationValid);
    }
    
    // 应用验证样式
    function applyValidationStyle(input, isValid) {
        if (input.value.trim().length > 0) {
            if (isValid) {
                input.style.borderColor = '#4CAF50';
                input.style.boxShadow = 'none';
            } else {
                input.style.borderColor = '#F44336';
                input.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.1)';
            }
        } else {
            input.style.borderColor = '#e0e0e0';
            input.style.boxShadow = 'none';
        }
    }
    
    // 获取验证码
    let countdown = 0;
    let timer = null;
    
    getCodeButton.addEventListener('click', function() {
        if (countdown > 0) return;
        
        const phone = phoneInput.value.trim();
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            phoneInput.style.borderColor = '#F44336';
            phoneInput.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.1)';
            return;
        }
        
        // 模拟发送验证码
        countdown = 60;
        getCodeButton.disabled = true;
        updateCountdown();
        
        timer = setInterval(function() {
            countdown--;
            updateCountdown();
            
            if (countdown <= 0) {
                clearInterval(timer);
                getCodeButton.disabled = false;
                getCodeButton.textContent = '获取验证码';
            }
        }, 1000);
    });
    
    function updateCountdown() {
        getCodeButton.textContent = `重新获取(${countdown}s)`;
    }
    
    // 监听输入变化
    usernameInput.addEventListener('input', validateForm);
    phoneInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);
    confirmPasswordInput.addEventListener('input', validateForm);
    verificationInput.addEventListener('input', validateForm);
    agreementCheckbox.addEventListener('change', validateForm);
    
    // 表单提交
    document.querySelector('.register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 在这里处理表单提交，例如AJAX请求或其他逻辑
        alert('注册成功！');
    });
    
    // 页面加载时初始验证
    validateForm();
    
    // 输入框获取焦点效果
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-3px)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
}); 