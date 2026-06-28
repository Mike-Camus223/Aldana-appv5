import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Footerv2Component } from '../../components/system/footerv2/footerv2.component';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { NavbarPublicv3Component } from '../../components/system/navbar-publicv3/navbar-publicv3.component';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarPublicv3Component,
    Footerv2Component,
  ],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy, AfterViewInit {

  constructor(
    private loaderService: LoaderService,
    private router: Router
  ) { }

  ngAfterViewInit(): void {
    ScrollSmoother.get()?.kill();

    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.4,
      effects: true
    });
  }

  ngOnInit(): void {
    // Configure route matchers where the generic loader should be skipped
    this.loaderService.setSkipGenericLoaderMatchers([
      /^\/checkout\/(?!carrito).*/,
    ]);
  }

  ngOnDestroy(): void {}
}

