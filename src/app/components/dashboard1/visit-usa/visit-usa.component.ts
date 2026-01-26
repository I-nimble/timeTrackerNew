import { Component, Inject, NgZone, OnInit, PLATFORM_ID, type AfterViewInit, type OnDestroy } from "@angular/core"
import { TablerIconsModule } from "angular-tabler-icons"
import { MaterialModule } from "src/app/material.module"
import { isPlatformBrowser, NgFor, NgIf } from "@angular/common"
import moment from 'moment-timezone';

// amCharts imports
import * as am5 from "@amcharts/amcharts5"
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated"
import * as am5map from "@amcharts/amcharts5/map"
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow"
import { EmployeesService } from "src/app/services/employees.service"
import { LocationService } from "src/app/services/location.service"

@Component({
  selector: "app-visit-usa",
  standalone: true,
  imports: [TablerIconsModule, MaterialModule, NgFor, NgIf],
  templateUrl: "./visit-usa.component.html",
})
export class AppVisitUsaComponent implements OnInit, AfterViewInit, OnDestroy {
  private root: am5.Root | undefined
  private timer: any;
  locations: any[] = [];
  clientLocation: any = null;
  locationError: string = '';
  private clientPointAdded: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public zone: NgZone,
    private employeesService: EmployeesService,
    private locationService: LocationService
  ) {}

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f()
      })
    }
  }

  ngOnInit() {
    this.fetchLocations();
    this.timer = setInterval(() => this.updateDisplayedTime(), 60000);
    this.getClientLocation();
  }

  async getClientLocation() {
    this.browserOnly(async () => {
      try {
        const geocodedData = await this.locationService.getClientLocationWithGeocoding();
        
        if (geocodedData) {
          this.clientLocation = {
            ...geocodedData,
            time: moment().format('hh:mm A'),
            isClient: true
          };

          this.addClientToMap();
        } else {
          this.locationError = this.locationService.getLocationError() || 'Unable to get your location';
        }
      } catch (error) {
        console.error('Error getting client location:', error);
        this.locationError = 'An error occurred while getting your location';
      }
    });
  }

  addClientToMap() {
    if (!this.root || !this.clientLocation || this.clientPointAdded) return;

    this.browserOnly(() => {
      const chart = this.root!.container.children.getIndex(0) as am5map.MapChart;
      if (!chart) return;

      const pointSeries = chart.series.getIndex(1) as am5map.MapPointSeries;
      if (!pointSeries) return;

      pointSeries.data.push({
        geometry: { 
          type: "Point", 
          coordinates: [parseFloat(this.clientLocation.longitude), parseFloat(this.clientLocation.latitude)] 
        },
        title: `You: ${this.clientLocation.city}`,
      });

      pointSeries.bullets.push(() => {
        const circle = am5.Circle.new(this.root!, {
          radius: 8,
          tooltipY: 0,
          fill: am5.color(0xff6b6b),
          strokeWidth: 2,
          stroke: am5.color(0xffffff),
          tooltipText: "{title}",
        });

        return am5.Bullet.new(this.root!, {
          sprite: circle,
        });
      });

      this.clientPointAdded = true;
      
      chart.goHome();
    });
  }

  fetchLocations() {
    this.employeesService.getLocations().subscribe(
      (locations: any[]) => {
        this.locations = locations;
        this.initMap();
        if (this.clientLocation) {
          this.addClientToMap();
        }
      },
      (error) => {
        console.error('Error fetching locations:', error);
      }
    );
  }

  updateDisplayedTime() {
    this.locations = this.locations.map(loc => {
      const timeMoment = moment(loc.time, 'hh:mm A');
      timeMoment.add(1, 'minute');
      return {
        ...loc,
        time: timeMoment.format('hh:mm A')
      };
    });

    if (this.clientLocation) {
      const timeMoment = moment(this.clientLocation.time, 'hh:mm A');
      timeMoment.add(1, 'minute');
      this.clientLocation.time = timeMoment.format('hh:mm A');
    }
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
          title: loc.city,
        });
      });

      if (this.clientLocation && !this.clientPointAdded) {
        this.addClientToMap();
      }

      chart.appear(1000, 100);
    });
  }
}