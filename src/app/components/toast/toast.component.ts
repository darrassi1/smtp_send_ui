import { Component, OnInit } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html'
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }

  getToastClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 border-green-300';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 border-red-300';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-300';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-300';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-300';
    }
  }

  getIconClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-200';
      case 'error':
        return 'text-red-200';
      case 'warning':
        return 'text-yellow-200';
      case 'info':
        return 'text-blue-200';
      default:
        return 'text-gray-200';
    }
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M5 13l4 4L19 7';
      case 'error':
        return 'M6 18L18 6M6 6l12 12';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }
}
