import { animate, createDraggable, Draggable, JSAnimation } from "animejs";
import { getCookie } from "./utils";
import type { User } from "./types";

function reset(animation: JSAnimation, draggable: Draggable) {
  if (animation) {
    animation.reset();
  }

  if (draggable) {
    draggable.reset();
  }

  let el = document.getElementsByClassName("draggable")[0] as HTMLElement;
  el.style.backgroundColor = "white";
  onSwipe(users[index], users.length);
}

let index = 0;
let users: Array<User>;
let selfUserId: string | undefined;

async function onSwipe(user: User, userCount: number) {
  let el = document.getElementById("profile-slot");

  if (index < userCount) {
    if (user.id === selfUserId) {
      console.log("found self");
      index += 1;
      onSwipe(users[index], users.length);
    }
    index += 1;

    const now = Date.now();
    const ageInMilis = Math.abs(user.birth_date * 1000 - now);
    const ageInYears = Math.round(ageInMilis / (1000 * 60 * 60 * 24 * 365));

    const inner = /*html*/ ` <img
    src="api/get_user_image/${user.id}"  
    height="400"
    alt=""
      class="profile-image"
      onerror="this.src='images/NoProfilePic.png'"
    />

    <h3>${user.name}</h3>
    <h4>Age: ${ageInYears}</h4>
    <div class="profile-desc">
    </div>`;

    if (el) {
      el.innerHTML = inner;
    } else {
      console.error("cannot find profile-slot");
    }
  } else {
    window.location.href = "/";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  selfUserId = getCookie("self-id");
  const usersReq = await fetch("api/get_users/");
  users = await usersReq.json();

  onSwipe(users[index], users.length);

  let animation: JSAnimation;
  let draggable: Draggable;

  draggable = createDraggable(".draggable", {
    x: {
      snap: [0, -(window.innerWidth / 2 - 250), +(window.innerWidth / 2 - 250)],
    },
    //y: { snap: [window.innerHeight * 0.35] },
    onSnap: (draggable) => {
      if (draggable.destX > 0) {
        // slide to right
        animation = animate(".draggable", {
          opacity: [{ to: 0, duration: 600 }],
          rotate: [{ to: "+30deg", duration: 600 }],
          onComplete: () => {
            reset(animation, draggable);
          },
        });
      } else {
        // slide to left
        animation = animate(".draggable", {
          opacity: [{ to: 0, duration: 600 }],
          rotate: [{ to: "-30deg", duration: 600 }],
          onComplete: () => {
            reset(animation, draggable);
          },
        });
      }
    },
  });
});
