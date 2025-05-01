import { animate, createDraggable, Draggable, JSAnimation } from "animejs";
import { profiles } from "./data.ts";

function reset(animation: JSAnimation, draggable: Draggable) {
  if (animation) {
    animation.reset();
  }

  if (draggable) {
    draggable.reset();
  }

  let el = document.getElementsByClassName("draggable")[0] as HTMLElement;
  el.style.backgroundColor = "white";
  onSwipe();
}

let index = 0;

function onSwipe() {
  if (index < profiles.length) {
    index += 1;

    const inner = /*html*/ ` <img
    src="${profiles[index].image}"  
    height="400"
    alt=""
      class="profile-image"
      onerror="this.src='images/NoProfilePic.png'"
    />

    <h3>${profiles[index].name}</h3>
    <h4>Age: ${profiles[index].age}</h4>
    <div class="profile-desc">
    ${profiles[index].bio}
    </div>`;

    let el = document.getElementById("profile-slot");

    if (el) {
      el.innerHTML = inner;
    } else {
      console.error("cannot find profile-slot");
    }
  } else {
    // TODO navigate to found page
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onSwipe();

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
          background: [{ to: "green", duration: 600 }],
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
          background: [{ to: "red", duration: 600 }],
          onComplete: () => {
            reset(animation, draggable);
          },
        });
      }
    },
  });
});
