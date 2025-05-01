import { animate, createDraggable, Draggable, JSAnimation } from "animejs";

function reset(animation: JSAnimation, draggable: Draggable) {
  if (animation) {
    animation.reset();
  }

  if (draggable) {
    draggable.reset();
  }

  let el = document.getElementsByClassName("draggable")[0] as HTMLElement;
  el.style.backgroundColor = "white";
}

document.addEventListener("DOMContentLoaded", () => {
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
