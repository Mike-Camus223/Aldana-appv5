import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

import { routes } from './app.routes';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, Award, Book, BookCheck,
  Calendar, Camera, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, Clock, CreditCard, Eye, EyeClosed, Funnel, Headset, Heart, HeartPlus,
  House, Image, LayoutGrid, Leaf, List, Lock, LogOut, Mail, MapPin, Maximize, Menu,
  MessageCircle, Minus, NotepadText, Package, Pause, Pencil, Phone, Play, Plus,
  RotateCcw, Search, Send, ShieldAlert, ShoppingBag, Sparkle, Star, Trash2, Truck,
  Upload, User, UserRound, UsersRound, X
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideClientHydration(withNoIncrementalHydration()),
    provideHttpClient(withFetch()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({
        AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, Award, Book, BookCheck,
        Calendar, Camera, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
        ChevronUp, Clock, CreditCard, Eye, EyeClosed, Funnel, Headset, Heart, HeartPlus,
        House, Image, LayoutGrid, Leaf, List, Lock, LogOut, Mail, MapPin, Maximize, Menu,
        MessageCircle, Minus, NotepadText, Package, Pause, Pencil, Phone, Play, Plus,
        RotateCcw, Search, Send, ShieldAlert, ShoppingBag, Sparkle, Star, Trash2, Truck,
        Upload, User, UserRound, UsersRound, X
      })
    )
  ]
};
