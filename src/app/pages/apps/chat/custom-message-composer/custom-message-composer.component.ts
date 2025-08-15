import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { FormsModule } from '@angular/forms';

interface InlineImage {
  id: string;
  file: File;
  dataUrl: string;
  position: number; // Position in the text where the image should be inserted
}

@Component({
  selector: 'app-custom-message-composer',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './custom-message-composer.component.html',
  styleUrls: ['./custom-message-composer.component.scss']
})
export class CustomMessageComposerComponent implements OnInit, OnDestroy {
  @Input() user: CometChat.User | null = null;
  @Input() group: CometChat.Group | null = null;
  @Input() hideVoiceRecording: boolean = false;
  @Input() hideAttachment: boolean = false;
  @Input() currentChatContext: any = null; // Add this to receive current context
  
  @Output() messageSent = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();
  @Output() emojiSelected = new EventEmitter<string>();
  @Output() voiceRecordingStarted = new EventEmitter<void>();
  @Output() voiceRecordingStopped = new EventEmitter<Blob>();
  
  @ViewChild('textArea', { static: false }) textArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  
  messageText: string = '';
  inlineImages: InlineImage[] = [];
  isComposing: boolean = false;
  cursorPosition: number = 0;
  isDragOver: boolean = false;
  
  private pasteListener: any;
  private dragOverListener: any;
  private dropListener: any;

  ngOnInit() {
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.removeEventListeners();
  }

  private setupEventListeners() {
    // Global paste listener
    this.pasteListener = this.handlePaste.bind(this);
    document.addEventListener('paste', this.pasteListener);
  }

  private removeEventListeners() {
    if (this.pasteListener) {
      document.removeEventListener('paste', this.pasteListener);
    }
  }

  onTextChange(event: any) {
    this.messageText = event.target.value;
    this.cursorPosition = event.target.selectionStart;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onFocus() {
    this.isComposing = true;
  }

  onBlur() {
    this.isComposing = false;
  }

  handlePaste(event: ClipboardEvent) {
    // Only handle paste if the composer is focused
    if (!this.isComposing) return;
    
    if (event.clipboardData?.files && event.clipboardData.files.length > 0) {
      event.preventDefault();
      const file = event.clipboardData.files[0];
      this.processImageFile(file);
    }
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  handleDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processImageFile(file);
    }
  }

  private processImageFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error.emit('Only image files are supported.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.error.emit('Image size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inlineImage: InlineImage = {
        id: imageId,
        file: file,
        dataUrl: e.target.result,
        position: this.cursorPosition
      };
      
      this.inlineImages.push(inlineImage);
      
      // Insert image placeholder in text
      const placeholder = `[${imageId}]`;
      const beforeCursor = this.messageText.substring(0, this.cursorPosition);
      const afterCursor = this.messageText.substring(this.cursorPosition);
      this.messageText = beforeCursor + placeholder + afterCursor;
      
      // Update cursor position
      this.cursorPosition += placeholder.length;
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (this.textArea) {
          this.textArea.nativeElement.focus();
          this.textArea.nativeElement.setSelectionRange(this.cursorPosition, this.cursorPosition);
        }
      }, 0);
    };
    
    reader.onerror = () => {
      this.error.emit('Error reading the image file.');
    };
    
    reader.readAsDataURL(file);
  }

  removeImage(imageId: string) {
    const imageIndex = this.inlineImages.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      const image = this.inlineImages[imageIndex];
      
      // Remove image placeholder from text
      const placeholder = `[${imageId}]`;
      this.messageText = this.messageText.replace(placeholder, '');
      
      // Remove image from array
      this.inlineImages.splice(imageIndex, 1);
      
      // Update positions for remaining images
      this.inlineImages.forEach(img => {
        if (img.position > image.position) {
          img.position -= placeholder.length;
        }
      });
    }
  }

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Handle different file types
      if (file.type.startsWith('image/')) {
        this.processImageFile(file);
      } else if (file.type.startsWith('video/')) {
        this.processVideoFile(file);
      } else if (file.type.startsWith('audio/')) {
        this.processAudioFile(file);
      } else {
        this.processGenericFile(file);
      }
    }
    // Reset the input value
    event.target.value = '';
  }

  private processVideoFile(file: File) {
    // Handle video files
    this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.VIDEO);
  }

  private processAudioFile(file: File) {
    // Handle audio files
    this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.AUDIO);
  }

  private processGenericFile(file: File) {
    // Handle generic files
    this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.FILE);
  }

  openEmojiPicker() {
    // Emit event to parent component to handle emoji picker
    this.emojiSelected.emit('open');
  }

  openVoiceRecorder() {
    // Emit event to parent component to handle voice recording
    this.voiceRecordingStarted.emit();
  }

  sendMessage() {
    if (!this.messageText.trim() && this.inlineImages.length === 0) {
      return;
    }

    if (this.inlineImages.length > 0) {
      // Send images first, then text message
      this.sendImagesWithText();
    } else {
      // Send text message only
      this.sendTextMessage();
    }
  }

  private sendImagesWithText() {
    const promises = this.inlineImages.map(image => this.sendImageMessage(image.file));
    
    Promise.all(promises).then(() => {
      // After all images are sent, send the text message if there's any text
      if (this.messageText.trim()) {
        this.sendTextMessage();
      }
      
      // Clear the composer
      this.clearComposer();
    }).catch((error) => {
      this.error.emit('Error sending images: ' + error.message);
    });
  }

  private sendImageMessage(file: File) {
    return this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.IMAGE);
  }

  private sendMediaMessage(file: File, messageType: string) {
    // Use currentChatContext if available, otherwise fall back to user/group props
    let receiverId: string;
    let receiverType: string;
    
    if (this.currentChatContext) {
      if (this.currentChatContext.user) {
        receiverId = this.currentChatContext.user.getUid();
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.currentChatContext.group) {
        receiverId = this.currentChatContext.group.getGuid();
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      } else {
        throw new Error('No valid chat context found');
      }
    } else if (this.user) {
      receiverId = this.user.getUid();
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.group) {
      receiverId = this.group.getGuid();
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    } else {
      throw new Error('No user or group specified');
    }

    const mediaMessage = new CometChat.MediaMessage(
      receiverId,
      file,
      messageType,
      receiverType
    );

    return CometChat.sendMediaMessage(mediaMessage).then((message) => {
      this.messageSent.emit(message);
    });
  }

  private sendTextMessage() {
    if (!this.messageText.trim()) return;

    // Use currentChatContext if available, otherwise fall back to user/group props
    let receiverId: string;
    let receiverType: string;
    
    if (this.currentChatContext) {
      if (this.currentChatContext.user) {
        receiverId = this.currentChatContext.user.getUid();
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.currentChatContext.group) {
        receiverId = this.currentChatContext.group.getGuid();
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      } else {
        this.error.emit('No valid chat context found');
        return;
      }
    } else if (this.user) {
      receiverId = this.user.getUid();
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.group) {
      receiverId = this.group.getGuid();
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    } else {
      this.error.emit('No user or group specified');
      return;
    }

    const textMessage = new CometChat.TextMessage(
      receiverId,
      this.messageText,
      receiverType
    );

    CometChat.sendMessage(textMessage).then((message) => {
      this.messageSent.emit(message);
      this.clearComposer();
    }).catch((error) => {
      this.error.emit('Error sending message: ' + error.message);
    });
  }

  private clearComposer() {
    this.messageText = '';
    this.inlineImages = [];
    this.cursorPosition = 0;
  }

  getDisplayText(): string {
    let displayText = this.messageText;
    
    // Replace image placeholders with visual indicators
    this.inlineImages.forEach(image => {
      const placeholder = `[${image.id}]`;
      displayText = displayText.replace(placeholder, '📷');
    });
    
    return displayText;
  }
} 