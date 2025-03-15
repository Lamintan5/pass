$(document).ready(function() {
    $('.message a').click(function() {
        $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
    });

    function storeUserData(user) {
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'index.html'; 
    }

    $('.register-form').submit(function(event) {
        event.preventDefault();

        const username = $('.register-form input[type="text"]').val();
        const email = $('.register-form input[type="text"][placeholder="email address"]').val();
        const password = $('.register-form input[type="password"]').val();
        const confirmPassword = $('.register-form input[type="password"][placeholder="confirm password"]').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        $.ajax({
            url: 'http://localhost:5000/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, email, password }),
            success: function(response) {
                alert(response.message);
                storeUserData(response.user); 
            },
            error: function(xhr) {
                alert(xhr.responseJSON.message);
            }
        });
    });

    $('.login-form').submit(function(event) {
        event.preventDefault();

        const identifier = $('.login-form input[type="text"]').val(); 
        const password = $('.login-form input[type="password"]').val();

        $.ajax({
            url: 'http://localhost:5000/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ identifier, password }),
            success: function(response) {
                alert(response.message);
                storeUserData(response.user); 
            },
            error: function(xhr) {
                alert(xhr.responseJSON.message);
            }
        });
    });
});
