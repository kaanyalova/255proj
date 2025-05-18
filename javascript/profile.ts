import $ from 'jquery';
import { eraseCookie, getCookie } from './utils';
import type { User } from './types';

$(async () => {
    const currentUserID = getCookie('self-id');
    const req = await fetch(`/api/get_user/${currentUserID}`);
    const user: User = await req.json();

    $('#account-name-slot').html(`Hello, ${user.name}`);

    const imageHTML = /*html*/ `
  <img src="/api/get_user_image/${user.id}" width="400"/> `;
    $('#account-image-slot').html(imageHTML);

    $('#date-of-birth-slot').html(
        new Date(user.birth_date * 1000).toDateString()
    );

    $('#name-slot').html(user.name);

    $('#surname-slot').html(user.surname);

    $('#log-out-button').on('click', () => {
        eraseCookie('self-id');
        eraseCookie('token');
        window.location.href = '/';
    });

    $('#bio-entry').val(user.bio);

    $('#bio-submit-button').on('click', async () => {
        const bioText = $('#bio-entry').val();
        await fetch(`/api/set_bio/${user.id}`, {
            method: 'POST',
            body: JSON.stringify({ bio: bioText }),
        });
    });
});
