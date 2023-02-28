export class NavigationStack {
  constructor(navItems, routes, rootRoute) {
    this.navItems = navItems;
    this.routes = routes;
    this.routeRoute = rootRoute;
    this.container = navItems[0].parentElement;
    this.translateX = this.container.offsetWidth;
    this.indexOfCurrentRoute = 0;

    this.setItems();

    this.container.addEventListener("click", (e) => {
      if(e.target.classList.contains("next") || e.target.classList.contains("back")) {
        const slideTo = +e.target.getAttribute("slide-to");
        let direction = e.target.classList.value.includes("next") ? slideTo - 1 : slideTo + 1;

        this.navItems[direction].style.transform = `translateX(${direction < slideTo ? "-100" : this.translateX}px)`;
        this.navItems[slideTo].style.transform = "translateX(0)";
        window.history.pushState({route: this.getRouteName(this.routes[slideTo])}, '', this.routes[slideTo]);
        window.dispatchEvent(new Event('popstate'));
      }
    })
  }

  setItems() {
    const isRoot = this.isRootRoute();
    if(!isRoot) {
      this.indexOfCurrentRoute = this.getIndexOfCurrentRoute();
    }

    this.navItems.forEach((item, i) => {
      item.style.position = "absolute";
      item.style.width = "100%";

      
      if(!isRoot) {
        if(i < this.indexOfCurrentRoute) {
          item.style.transform = `translateX(-100px)`;
        } else if(i > this.indexOfCurrentRoute) {
          item.style.transform = "translateX(" + this.translateX + "px)";
        }
      } else {
        if(i !== 0) {
          item.style.transform = "translateX(" + this.translateX + "px)";
        }
      }
      
      item.style.zIndex = i;
      item.style.backgroundColor = "white";
      item.style.minHeight = `${this.container.offsetHeight}px`;

      const nextButton = item.querySelector(".next");
      const backButton = item.querySelector(".back");
      if(backButton) {
        backButton.setAttribute("slide-to", i - 1);
      }
      if(nextButton) {
        nextButton.setAttribute("slide-to", i + 1)
      }
      
      setTimeout(() => {
        item.style.transition = '0.4s all ease';
      }, 400)
    })
  }

  splitRoutePath() {
    return window.location.pathname.split("/").filter(loc => loc !== "");
  }

  isRootRoute() {
    const splitLocation = this.splitRoutePath();

    return splitLocation[splitLocation.length - 1] === this.rootRoute;
  }

  getRouteName(route) {
    const routePath = route.split("/").filter(loc => loc !== "");

    return routePath[routePath.length -1];
  }

  getIndexOfCurrentRoute() {
    const location = window.location.pathname.slice(- 1) === "/" ? window.location.href.slice(0, window.location.href.length - 2) : window.location.href;
    return this.routes.indexOf(window.location.href);
  }
}