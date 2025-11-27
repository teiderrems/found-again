import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, Input, Output, EventEmitter, HostListener, ContentChild, TemplateRef } from '@angular/core';
import { MatIcon, MatIconModule } from "@angular/material/icon";

export interface DropdownOption {
  value: any;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css'],
  standalone:true,
  imports: [NgTemplateOutlet, CommonModule, MatIconModule]
})
export class DropdownComponent {
  @Input() options: DropdownOption[] = [];
  @Input() selectedValue: any;
  @Input() disabled: boolean = false;
  @Input() placement: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' = 'bottom-left';
  @Input() closeOnSelect: boolean = true;
  @Input() showIcons: boolean = true;
  
  @Output() selectionChange = new EventEmitter<any>();
  @Output() isOpenChange = new EventEmitter<boolean>();

  @ContentChild('dropdownTrigger') triggerTemplate!: TemplateRef<any>;
  @ContentChild('dropdownOption') optionTemplate!: TemplateRef<any>;

  isOpen = false;

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      this.isOpenChange.emit(this.isOpen);
    }
  }

  openDropdown() {
    if (!this.disabled) {
      this.isOpen = true;
      this.isOpenChange.emit(this.isOpen);
    }
  }

  closeDropdown() {
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
  }

  selectOption(option: DropdownOption, event?: MouseEvent) {
    // Empêche la propagation pour éviter que le clic ne remonte au document
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!option.disabled) {
      this.selectedValue = option.value;
      this.selectionChange.emit(option.value);
      
      if (this.closeOnSelect) {
        this.closeDropdown();
      }
    }
  }

  getSelectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.selectedValue);
    return selected ? selected.label : '';
  }

  getSelectedOption(): DropdownOption | undefined {
    return this.options.find(opt => opt.value === this.selectedValue);
  }

  getPanelClasses(): string {
    const baseClasses = 'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto min-w-48';
    const placementClasses = {
      'bottom-left': 'top-full left-0 mt-1',
      'bottom-right': 'top-full right-0 mt-1',
      'top-left': 'bottom-full left-0 mb-1',
      'top-right': 'bottom-full right-0 mb-1'
    };
    return `${baseClasses} ${placementClasses[this.placement]}`;
  }

  isEmoji(icon: string): boolean {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    return emojiRegex.test(icon);
  }

  isImageUrl(icon: string): boolean {
    return icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:image');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Vérifie si le clic est en dehors du dropdown
    if (!target.closest('.dropdown-container') && this.isOpen) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.isOpen) {
      this.closeDropdown();
    }
  }
}