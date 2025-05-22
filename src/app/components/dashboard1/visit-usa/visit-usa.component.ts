import { Component, Inject, NgZone, OnInit, PLATFORM_ID, type AfterViewInit, type OnDestroy } from "@angular/core"
import { TablerIconsModule } from "angular-tabler-icons"
import { MaterialModule } from "src/app/material.module"
import { isPlatformBrowser } from "@angular/common"

// amCharts imports
import * as am5 from "@amcharts/amcharts5"
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated"
import * as am5map from "@amcharts/amcharts5/map"
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow"

@Component({
  selector: "app-visit-usa",
  standalone: true,
  imports: [TablerIconsModule, MaterialModule],
  templateUrl: "./visit-usa.component.html",
})
export class AppVisitUsaComponent implements OnInit, AfterViewInit, OnDestroy {
  private root: am5.Root | undefined
  private timer: any;
  atlTime: string = '';
  mcboTime: string = '';


  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public zone: NgZone
  ) {}

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f()
      })
    }
  }

  ngOnInit() {
      this.updateTimes()
      this.timer = setInterval(() => this.updateTimes(), 1000)
  }

  ngAfterViewInit() {
    this.browserOnly(() => {
      const root = am5.Root.new("current-visitors")
      this.root = root

      root.setThemes([am5themes_Animated.new(root)])

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          panX: "rotateX",
          panY: "translateY",
          projection: am5map.geoMercator(),
        }),
      )

      const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}))
      zoomControl.homeButton.set("visible", true)

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_worldLow,
          exclude: ["AQ"],
        }),
      )

      polygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xdadada),
      })

      const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))

      pointSeries.bullets.push(() => {
        const circle = am5.Circle.new(root, {
          radius: 8,
          tooltipY: 0,
          fill: am5.color(0x1b84ff),
          strokeWidth: 2,
          stroke: am5.color(0xffffff),
          tooltipText: "{title}",
        })

        return am5.Bullet.new(root, {
          sprite: circle,
        })
      })

      const cities = [
        { title: "ATL", latitude: 33.749, longitude: -84.388 },
        { title: "MCBO", latitude: 10.6427, longitude: -71.6125 },
      ]

      cities.forEach((city) => {
        pointSeries.data.push({
          geometry: { type: "Point", coordinates: [city.longitude, city.latitude] },
          title: city.title,
        })
      })

      chart.appear(1000, 100)
    })
  }

  updateTimes() {
  this.atlTime = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
  });

  this.mcboTime = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
  });
}

  ngOnDestroy() {
    this.browserOnly(() => {
      if (this.root) {
        this.root.dispose()
      }
      if (this.timer) {
        clearInterval(this.timer)
      }
    })
  }
}
