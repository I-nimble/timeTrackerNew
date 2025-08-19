import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, TemplateRef, HostListener, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { emojisByCategory } from '../emojisByCategory';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-custom-message-composer',
    imports: [MaterialModule, CommonModule],
	templateUrl: './custom-message-composer.component.html',
	styleUrls: ['./custom-message-composer.component.scss']
})
export class CustomMessageComposerComponent implements OnInit, OnDestroy {
	@Input() currentChatContext: any;
    @Input() hideVoiceRecording: boolean = false;

	messageText: string = '';
	inlineImages: any[] = [];
	isComposing: boolean = false;
	cursorPosition: number = 0;
	isDragOver: boolean = false;

	showAttachmentDropdown: boolean = false;
	showEmojiDropdown: boolean = false;
	emojisByCategory = emojisByCategory;
	emojiCategories = Object.values(emojisByCategory);

	showVoiceRecorderDropdown = false;
	isRecording = false;
	voiceRecorderTime = '00:00';
	recordedAudioUrl: string | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private voiceRecorderTimerInterval: any = null;
	private voiceRecorderStartTime: number = 0;
	private recordedChunks: Blob[] = [];

	@ViewChild('textArea', { static: false }) textArea!: ElementRef<HTMLTextAreaElement>;
	@ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
	@ViewChild('imageInput', { static: false }) imageInput!: ElementRef<HTMLInputElement>;
	@ViewChild('videoInput', { static: false }) videoInput!: ElementRef<HTMLInputElement>;
	@ViewChild('audioInput', { static: false }) audioInput!: ElementRef<HTMLInputElement>;

	constructor(private cdr: ChangeDetectorRef, private snackBar: MatSnackBar) {}

    ngOnInit () {
        document.addEventListener('paste', this.handlePaste.bind(this));
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
		if (!file.type.startsWith('image/')) return;
		if (file.size > 10 * 1024 * 1024) return;
		const reader = new FileReader();
		reader.onload = (e: any) => {
			const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const inlineImage = {
				id: imageId,
				file: file,
				dataUrl: e.target.result,
				position: this.cursorPosition
			};
			this.inlineImages.push(inlineImage);
			setTimeout(() => {
				if (this.textArea) {
					this.textArea.nativeElement.focus();
					this.textArea.nativeElement.setSelectionRange(this.cursorPosition, this.cursorPosition);
				}
			}, 0);
		};
		reader.readAsDataURL(file);
	}

	removeImage(imageId: string) {
		const imageIndex = this.inlineImages.findIndex(img => img.id === imageId);
		if (imageIndex !== -1) {
			this.inlineImages.splice(imageIndex, 1);
		}
	}

	triggerFileInput() {
		if (this.fileInput) {
			this.fileInput.nativeElement.click();
		}
	}

	toggleAttachmentDropdown() {
		this.showAttachmentDropdown = !this.showAttachmentDropdown;
		this.showEmojiDropdown = false;
	}

	toggleEmojiDropdown() {
		this.showEmojiDropdown = !this.showEmojiDropdown;
		this.showAttachmentDropdown = false;
	}

	selectAttachmentType(type: string) {
		this.showAttachmentDropdown = false;
		switch (type) {
			case 'image':
				if (this.imageInput) this.imageInput.nativeElement.click();
				break;
			case 'video':
				if (this.videoInput) this.videoInput.nativeElement.click();
				break;
			case 'audio':
				if (this.audioInput) this.audioInput.nativeElement.click();
				break;
			case 'file':
				if (this.fileInput) this.fileInput.nativeElement.click();
				break;
		}
	}

	selectEmoji(emoji: string) {
		const beforeCursor = this.messageText.substring(0, this.cursorPosition);
		const afterCursor = this.messageText.substring(this.cursorPosition);
		this.messageText = beforeCursor + emoji + afterCursor;
		this.cursorPosition += emoji.length;
		setTimeout(() => {
			if (this.textArea) {
				this.textArea.nativeElement.focus();
				this.textArea.nativeElement.setSelectionRange(this.cursorPosition, this.cursorPosition);
			}
		}, 0);
	}

	scrollToCategory(position: number) {
		const dropdownContent = document.querySelector('.emoji-dropdown-content');
		if (!dropdownContent) return;
		const categoryLabel = dropdownContent.querySelector(`#emoji-cat-${position}`);
		if (categoryLabel) {
			const top = (categoryLabel as HTMLElement).offsetTop;
			(dropdownContent as HTMLElement).scrollTo({ top, behavior: 'smooth' });
		}
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: Event) {
		const target = event.target as HTMLElement;
		if (!target.closest('.attachment-dropdown-container')) {
			this.showAttachmentDropdown = false;
		}
		if (!target.closest('.emoji-dropdown-container')) {
			this.showEmojiDropdown = false;
		}
	}

	onFileSelected(event: any) {
		const file = event.target.files[0];
		if (file) {
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
		event.target.value = '';
	}

    private processVideoFile(file: File) {
        this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.VIDEO);
    }

    private processAudioFile(file: File) {
        this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.AUDIO);
    }

    private processGenericFile(file: File) {
        this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.FILE);
    }

	// Voice recorder logic
	toggleVoiceRecorderDropdown() {
		this.showVoiceRecorderDropdown = !this.showVoiceRecorderDropdown;
		if (!this.showVoiceRecorderDropdown) {
			this.discardVoiceRecording();
		} else {
			this.isRecording = false;
			this.voiceRecorderTime = '00:00';
			this.recordedAudioUrl = null;
			this.recordedChunks = [];
			this.stopVoiceRecorderTimer();
		}
	}

	startVoiceRecording() {
		this.isRecording = true;
		this.voiceRecorderTime = '00:00';
		this.recordedChunks = [];
		this.recordedAudioUrl = null;
		this.voiceRecorderStartTime = Date.now();
		this.startVoiceRecorderTimer();
		navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
			this.mediaRecorder = new MediaRecorder(stream);
			this.mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					this.recordedChunks.push(e.data);
				}
			};
			this.mediaRecorder.onstop = () => {
				const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
				this.recordedAudioUrl = URL.createObjectURL(audioBlob);
				stream.getTracks().forEach(track => track.stop());
			};
			this.mediaRecorder.start();
		}).catch(() => {
			this.discardVoiceRecording();
		});
	}

	stopVoiceRecording() {
		if (this.mediaRecorder && this.isRecording) {
			this.mediaRecorder.stop();
			this.isRecording = false;
			this.stopVoiceRecorderTimer();
		}
	}

	discardVoiceRecording() {
		if (this.mediaRecorder && this.isRecording) {
			this.mediaRecorder.stop();
		}
		this.isRecording = false;
		this.showVoiceRecorderDropdown = false;
		this.voiceRecorderTime = '00:00';
		this.recordedAudioUrl = null;
		this.recordedChunks = [];
		this.stopVoiceRecorderTimer();
	}

	sendVoiceRecording() {
		if (!this.recordedAudioUrl) return;
		fetch(this.recordedAudioUrl)
			.then(res => res.blob())
			.then(blob => {
				const audioFile = new File([blob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
				this.sendMediaMessage(audioFile, CometChat.MESSAGE_TYPE.AUDIO);
				this.discardVoiceRecording();
			});
	}

	private startVoiceRecorderTimer() {
		this.stopVoiceRecorderTimer();
		this.voiceRecorderTimerInterval = setInterval(() => {
			const elapsed = Math.floor((Date.now() - this.voiceRecorderStartTime) / 1000);
			const min = Math.floor(elapsed / 60).toString().padStart(2, '0');
			const sec = (elapsed % 60).toString().padStart(2, '0');
			this.voiceRecorderTime = `${min}:${sec}`;
			this.cdr.detectChanges();
		}, 1000);
	}

	private stopVoiceRecorderTimer() {
		if (this.voiceRecorderTimerInterval) {
			clearInterval(this.voiceRecorderTimerInterval);
			this.voiceRecorderTimerInterval = null;
		}
	}

	sendMessage() {
		if (!this.messageText.trim() && this.inlineImages.length === 0) {
			return;
		}
		if (this.inlineImages.length > 0) {
			this.sendImagesWithText();
		} else {
			this.sendTextMessage();
		}
	}

	private sendImagesWithText() {
		const promises = this.inlineImages.map(image => this.sendImageMessage(image.file));
		Promise.all(promises).then(() => {
			if (this.messageText.trim()) {
				this.sendTextMessage();
			}
			this.clearComposer();
		}).catch((error) => {
			this.openSnackBar('Error sending images: ' + error.message, 'Close');
		});
	}

	private sendImageMessage(file: File) {
		return this.sendMediaMessage(file, 'image');
	}

    private async sendMediaMessage(file: File, messageType: string) {
        if (!this.currentChatContext) {
            this.openSnackBar('No active chat context', 'Close');
            return Promise.reject('No active chat context');
        }

        let receiverId: string;
        let receiverType: string;

        if (this.currentChatContext.user) {
            receiverId = this.currentChatContext.user.getUid();
            receiverType = CometChat.RECEIVER_TYPE.USER;
        } else if (this.currentChatContext.group) {
            receiverId = this.currentChatContext.group.getGuid();
            receiverType = CometChat.RECEIVER_TYPE.GROUP;
        } else {
            this.openSnackBar('No valid chat context found', 'Close');
            return Promise.reject('No valid chat context found');
        }

        const mediaMessage = new CometChat.MediaMessage(
            receiverId,
            file,
            messageType,
            receiverType
        );

        return CometChat.sendMediaMessage(mediaMessage);
    }


	private sendTextMessage() {
		if (!this.messageText.trim()) return;
		if (!this.currentChatContext) return;
		let receiverId: string;
		let receiverType: string;
		if (this.currentChatContext.user) {
			receiverId = this.currentChatContext.user.getUid();
			receiverType = CometChat.RECEIVER_TYPE.USER;
		} else if (this.currentChatContext.group) {
			receiverId = this.currentChatContext.group.getGuid();
			receiverType = CometChat.RECEIVER_TYPE.GROUP;
		} else {
			this.openSnackBar('No valid chat context found', 'Close');
            return;
		}
		const textMessage = new CometChat.TextMessage(
            receiverId,
            this.messageText,
            receiverType
        );
    
        CometChat.sendMessage(textMessage).then((message) => {
            this.clearComposer();
        }).catch((error) => {
            this.openSnackBar('Error sending message: ' + error.message, 'Close');
        });
	}

	private clearComposer() {
		this.messageText = '';
		this.inlineImages = [];
		this.cursorPosition = 0;
	}

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        });
    }

	ngOnDestroy() {
		this.stopVoiceRecorderTimer();
        document.removeEventListener('paste', this.handlePaste.bind(this));
	}
}
