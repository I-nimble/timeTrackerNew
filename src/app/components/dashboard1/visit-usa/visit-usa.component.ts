import { Component, Inject, NgZone, OnInit, PLATFORM_ID, type AfterViewInit, type OnDestroy } from "@angular/core"
import { TablerIconsModule } from "angular-tabler-icons"
import { MaterialModule } from "src/app/material.module"
import { isPlatformBrowser, NgFor } from "@angular/common"

// amCharts imports
import * as am5 from "@amcharts/amcharts5"
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated"
import * as am5map from "@amcharts/amcharts5/map"
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow"
import { EmployeesService } from "src/app/services/employees.service"

@Component({
  selector: "app-visit-usa",
  standalone: true,
  imports: [TablerIconsModule, MaterialModule, NgFor],
  templateUrl: "./visit-usa.component.html",
})
export class AppVisitUsaComponent implements OnInit, AfterViewInit, OnDestroy {
  private root: am5.Root | undefined
  private timer: any;
  locations: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public zone: NgZone,
    private employeesService: EmployeesService
  ) {}

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f()
      })
    }
  }

  ngOnInit() {
    this.employeesService.getLocations().subscribe((locations: any[]) => {
      this.locations = locations;
      this.updateLocationTimes();
      this.initMap();

      this.timer = setInterval(() => this.updateLocationTimes(), 1000);
    });
  }

  ngAfterViewInit() {
    if (this.locations.length) {
      this.initMap();
    }
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

  initMap() {
    this.browserOnly(() => {
      const root = am5.Root.new("current-visitors");
      this.root = root;

      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          panX: "rotateX",
          panY: "translateY",
          projection: am5map.geoMercator(),
        }),
      );

      const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
      zoomControl.homeButton.set("visible", true);

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_worldLow,
          exclude: ["AQ"],
        }),
      );

      polygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xdadada),
      });

      const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

      pointSeries.bullets.push(() => {
        const circle = am5.Circle.new(root, {
          radius: 8,
          tooltipY: 0,
          fill: am5.color(0x1b84ff),
          strokeWidth: 2,
          stroke: am5.color(0xffffff),
          tooltipText: "{title}",
        });

        return am5.Bullet.new(root, {
          sprite: circle,
        });
      });

      this.locations.forEach((loc) => {
        pointSeries.data.push({
          geometry: { type: "Point", coordinates: [parseFloat(loc.longitude), parseFloat(loc.latitude)] },
          title: loc.name,
        });
      });

      chart.appear(1000, 100);
    });
  }

  getLocalTime(latitude: string, longitude: string): string {
    const lng = parseFloat(longitude);
    
    const timeZoneOffset = Math.round(lng / 15);
    const now = new Date();
    
    now.setHours(now.getUTCHours() + timeZoneOffset);
    
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  updateLocationTimes() {
    this.locations = this.locations.map(loc => ({
      ...loc, 
      time: this.getLocalTime(loc.latitude, loc.longitude)
    }));
  }
}
