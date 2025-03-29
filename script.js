// This file contains JavaScript code that adds interactivity to the web page.
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    // Show the registration form
    window.showRegisterForm = function() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    };

    // Handle registration form submission
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const data = {
            nome: formData.get('nome'),
            data_nascimento: formData.get('data_nascimento'),
            telefone: formData.get('telefone'),
            genero: formData.get('genero'),
            escala: formData.get('escala'),
            grau: formData.get('grau'),
            senha: formData.get('senha')
        };

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            alert('Registration successful!');
            registerForm.reset();
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
        });
    });

    // Handle food selection button clicks
    document.querySelectorAll('.food-button').forEach(button => {
        button.addEventListener('click', () => {
            const foodName = button.dataset.foodName;
            fetch('/lanches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ foodName: foodName })
            })
            .then(response => response.json())
            .then(data => {
                button.textContent = `Selected by: ${data.user}`;
                button.disabled = true; // Disable button after selection
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const greetingElement = document.getElementById('greeting');
    greetingElement.textContent = 'Welcome to My Web Project!';
    
    const button = document.getElementById('myButton');
    button.addEventListener('click', () => {
        alert('Button was clicked!');
    });
});
