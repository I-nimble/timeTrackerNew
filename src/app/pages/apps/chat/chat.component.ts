import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild, TemplateRef, ElementRef, HostListener } from '@angular/core';
import { PlansService } from 'src/app/services/plans.service';
import { Plan } from 'src/app/models/Plan.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { CometChatService } from '../../../services/apps/chat/chat.service';
import { CometChatThemeService, CometChatConversationsWithMessages, CometChatGroupsWithMessages } from '@cometchat/chat-uikit-angular';
import '@cometchat/uikit-elements';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewGroupDialogComponent } from './new-group-dialog/new-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesConfiguration, DetailsConfiguration, AddMembersConfiguration, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, MessageHeaderConfiguration, ContactsConfiguration, UsersConfiguration } from '@cometchat/uikit-shared';
import { BackdropStyle } from "@cometchat/uikit-elements";
import { Subscription } from 'rxjs';
import { CometChatUIEvents } from "@cometchat/uikit-resources"
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';

interface InlineImage {
  id: string;
  file: File;
  dataUrl: string;
  position: number;
}

@Component({
  standalone: true,
  selector: 'app-chat',
  imports: [
    CometChatConversationsWithMessages,
    CometChatGroupsWithMessages,
    CommonModule,
    MaterialModule,
    LoaderComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppChatComponent implements OnInit {
  plansService = inject(PlansService);
  plan?: Plan;
  userRole: string | null = localStorage.getItem('role');
  userId: string | null = localStorage.getItem('id');
  groupCreatorUserIds = ['189', '181']; // Steffi and Fernando
  companies: any[] = [];
  selectedCompanyId!: number;
  public ccActiveChatChanged: Subscription;
  private themeMutationObserver: MutationObserver;
  public loader: Loader = new Loader(true, false, false);
  public chatInitError: string | null = null;
  
  // Custom message composer properties
  messageText: string = '';
  inlineImages: InlineImage[] = [];
  isComposing: boolean = false;
  cursorPosition: number = 0;
  isDragOver: boolean = false;
  hideVoiceRecording: boolean = false;
  
  // BASIC PLAN CONFIGURATION
  public basicMessagesConfig: MessagesConfiguration;
  public backdropStyle = new BackdropStyle({
    position: 'absolute',
  });
  // ESSENTIAL PLAN CONFIGURATION
  public essentialMessagesConfig: MessagesConfiguration;
  // PROFESSIONAL PLAN CONFIGURATION
  public professionalMessagesConfig: MessagesConfiguration;

  @ViewChild('customMenu', { static: true }) customMenu!: TemplateRef<any>;
  @ViewChild('customMessageComposerView', { static: true }) customMessageComposerView!: TemplateRef<any>;
  @ViewChild('textArea', { static: false }) textArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imageInput', { static: false }) imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput', { static: false }) videoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('audioInput', { static: false }) audioInput!: ElementRef<HTMLInputElement>;
  currentChatContext: any = null;

  // Dropdown states
  showAttachmentDropdown: boolean = false;
  showEmojiDropdown: boolean = false;

  // Emoji list
  emojiList: string[] = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀',
    '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
    '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦',
    '👩', '🧑', '👨', '👵', '🧓', '👴', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️',
    '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸',
    '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼',
    '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛',
    '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️',
    '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
    '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
    '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
    '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
    '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
    '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️',
    '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠',
    'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🛂', '🛃',
    '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁',
    '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕',
    '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣',
    '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️',
    '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽',
    '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️',
    '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵',
    '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️',
    '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿',
    '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫',
    '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲',
    '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩',
    '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔',
    '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️',
    '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖',
    '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠',
    '🕡', '🕢', '🕣', '🕤', '🕦', '🕧'
  ];

  getButtonStyle() {
    return {
      height: '20px',
      width: '20px',
      border: 'none',
      borderRadius: '0',
      background: 'transparent',
      padding: '0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
  }
  getButtonIconStyle() {
    return {
      filter: 'invert(69%) sepia(17%) saturate(511%) hue-rotate(57deg) brightness(91%) contrast(88%)'
    };
  }

  // Custom message composer methods
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
      this.openSnackBar('Only image files are supported.', 'Close');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.openSnackBar('Image size must be less than 10MB.', 'Close');
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
      // const placeholder = `[${imageId}]`;
      const beforeCursor = this.messageText.substring(0, this.cursorPosition);
      const afterCursor = this.messageText.substring(this.cursorPosition);
      // this.messageText = beforeCursor + placeholder + afterCursor;
      
      // Update cursor position
      // this.cursorPosition += placeholder.length;
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (this.textArea) {
          this.textArea.nativeElement.focus();
          this.textArea.nativeElement.setSelectionRange(this.cursorPosition, this.cursorPosition);
        }
      }, 0);
    };
    
    reader.onerror = () => {
      this.openSnackBar('Error reading the image file.', 'Close');
    };
    
    reader.readAsDataURL(file);
  }

  removeImage(imageId: string) {
    const imageIndex = this.inlineImages.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      // const image = this.inlineImages[imageIndex];
      
      // Remove image placeholder from text
      // const placeholder = `[${imageId}]`;
      // this.messageText = this.messageText.replace(placeholder, '');
      
      // Remove image from array
      this.inlineImages.splice(imageIndex, 1);
      
      // Update positions for remaining images
      // this.inlineImages.forEach(img => {
      //   if (img.position > image.position) {
      //     img.position -= placeholder.length;
      //   }
      // });
    }
  }

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  // Dropdown methods
  toggleAttachmentDropdown() {
    this.showAttachmentDropdown = !this.showAttachmentDropdown;
    this.showEmojiDropdown = false; // Close emoji dropdown if open
  }

  toggleEmojiDropdown() {
    this.showEmojiDropdown = !this.showEmojiDropdown;
    this.showAttachmentDropdown = false; // Close attachment dropdown if open
  }

  selectAttachmentType(type: string) {
    this.showAttachmentDropdown = false;
    
    switch (type) {
      case 'image':
        if (this.imageInput) {
          this.imageInput.nativeElement.click();
        }
        break;
      case 'video':
        if (this.videoInput) {
          this.videoInput.nativeElement.click();
        }
        break;
      case 'audio':
        if (this.audioInput) {
          this.audioInput.nativeElement.click();
        }
        break;
      case 'file':
        if (this.fileInput) {
          this.fileInput.nativeElement.click();
        }
        break;
    }
  }

  selectEmoji(emoji: string) {
    this.showEmojiDropdown = false;
    
    // Insert emoji at cursor position
    const beforeCursor = this.messageText.substring(0, this.cursorPosition);
    const afterCursor = this.messageText.substring(this.cursorPosition);
    this.messageText = beforeCursor + emoji + afterCursor;
    
    // Update cursor position
    this.cursorPosition += emoji.length;
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (this.textArea) {
        this.textArea.nativeElement.focus();
        this.textArea.nativeElement.setSelectionRange(this.cursorPosition, this.cursorPosition);
      }
    }, 0);
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    
    // Close attachment dropdown if clicking outside
    if (!target.closest('.attachment-dropdown-container')) {
      this.showAttachmentDropdown = false;
    }
    
    // Close emoji dropdown if clicking outside
    if (!target.closest('.emoji-dropdown-container')) {
      this.showEmojiDropdown = false;
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
    this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.VIDEO);
  }

  private processAudioFile(file: File) {
    this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.AUDIO);
  }

  private processGenericFile(file: File) {
    this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.FILE);
  }

  openVoiceRecorder() {
    this.openSnackBar('Implement this functionality', 'Close');
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
      this.openSnackBar('Error sending images: ' + error.message, 'Close');
    });
  }

  private sendImageMessage(file: File) {
    return this.sendMediaMessage(file, CometChat.MESSAGE_TYPE.IMAGE);
  }

  private sendMediaMessage(file: File, messageType: string) {
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

    return CometChat.sendMediaMessage(mediaMessage).then((message) => {
      this.openSnackBar('Media sent successfully!', 'Close');
    });
  }

  private sendTextMessage() {
    if (!this.messageText.trim()) return;

    if (!this.currentChatContext) {
      this.openSnackBar('No active chat context', 'Close');
      return;
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

  constructor(
    private themeService: CometChatThemeService,
    public chatService: CometChatService,
    private companiesService: CompaniesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private employeesService: EmployeesService
  ) { }

  ngOnInit(): void {
    try {
      this.configureTheme();
      this.observeAppTheme();
      this.initPlanLogic();
    } catch (err) {
      this.loader = new Loader(true, true, true);
      this.chatInitError = 'There was an error initializing the chat.';
      console.error('Chat initialization error:', err);
    }
  }

  private initPlanLogic() {
    this.ccActiveChatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((event: any) => {
      this.currentChatContext = event;
      
      if (event.group) {
        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            disableReactions: true,
            templates: this.chatService.templates
          }),
          messageHeaderConfiguration: new MessageHeaderConfiguration({
            menu: null // Hide call buttons for groups
          }),
          threadedMessageConfiguration: new ThreadedMessagesConfiguration({
            hideMessageComposer: true,
          })
        });
      } else {
        this.essentialMessagesConfig = new MessagesConfiguration({
          disableSoundForMessages: true,
          messageListConfiguration: new MessageListConfiguration({
            disableReactions: true,
            templates: this.chatService.templates
          }),
          threadedMessageConfiguration: new ThreadedMessagesConfiguration({
            hideMessageComposer: true,
          }),
          messageHeaderConfiguration: new MessageHeaderConfiguration({
            menu: this.customMenu
          }),
        })
      }
    });

    try {
      if(this.userRole === '3') {
        this.companiesService.getByOwner().subscribe({
          next: (company: any) => {
            this.plansService.getCurrentPlan(company.company.id).subscribe({
              next: (companyPlan: any) => {
                this.plan = companyPlan.plan || { id: companyPlan[0] };
                this.loader = new Loader(true, true, false);
              },
              error: (err) => {
                this.loader = new Loader(true, true, true);
                this.chatInitError = 'There was an error loading the plan.';
                console.error('Plan loading error:', err);
              }
            });
          },
          error: (err) => {
            this.loader = new Loader(true, true, true);
            this.chatInitError = 'There was an error loading the company.';
            console.error('Company loading error:', err);
          }
        });
      }
      else if (this.userRole === '2') {
        this.employeesService.getByEmployee().subscribe({
          next: (employees: any) => {
            this.plansService.getCurrentPlan(employees.company_id).subscribe({
              next: (companyPlan: any) => {
                this.plan = companyPlan.plan || { id: companyPlan[0] };
                this.loader = new Loader(true, true, false);
              },
              error: (err) => {
                this.loader = new Loader(true, true, true);
                this.chatInitError = 'There was an error loading the plan.';
                console.error('Plan loading error:', err);
              }
            });
          },
          error: (err) => {
            this.loader = new Loader(true, true, true);
            this.chatInitError = 'There was an error loading the employee.';
            console.error('Employee loading error:', err);
          }
        });
      } else {
        this.loader = new Loader(true, true, false);
      }
    } catch (err) {
      this.loader = new Loader(true, true, true);
      this.chatInitError = 'There was an error initializing the chat.';
      console.error('Chat initialization error:', err);
    }
  }

  ngAfterViewInit() {
    document.addEventListener('cc-image-clicked', () => {
      const viewer = document.querySelector('cometchat-full-screen-viewer');
      if (viewer) {
        document.body.appendChild(viewer);
      }
    });

    // Add paste event listener to the document
    document.addEventListener('paste', this.handlePaste.bind(this));

    const component = this;

    this.professionalMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true,
      messageComposerView: this.customMessageComposerView,
      messageListConfiguration: new MessageListConfiguration({
        templates: this.chatService.templates
      }),
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: this.customMenu
      }),
      detailsConfiguration: new DetailsConfiguration({
        addMembersConfiguration: new AddMembersConfiguration({
          usersRequestBuilder: new CometChat.UsersRequestBuilder()
            .setLimit(100)
            .friendsOnly(true)
        })
      })
    })

    this.essentialMessagesConfig = new MessagesConfiguration({
      disableSoundForMessages: true,
      messageComposerView: this.customMessageComposerView,
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
        templates: this.chatService.templates
      }),
      threadedMessageConfiguration: new ThreadedMessagesConfiguration({
        hideMessageComposer: true,
      }),
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: this.customMenu
      }),
      detailsConfiguration: new DetailsConfiguration({
        addMembersConfiguration: new AddMembersConfiguration({
          usersRequestBuilder: new CometChat.UsersRequestBuilder()
            .setLimit(100)
            .friendsOnly(true)
        })
      })
    })

    this.basicMessagesConfig = new MessagesConfiguration({ 
      messageComposerView: this.customMessageComposerView,
      messageHeaderConfiguration: new MessageHeaderConfiguration({
        menu: null
      }),
      disableSoundForMessages: true,
      messageListConfiguration: new MessageListConfiguration({
        disableReactions: true,
        templates: this.chatService.templates
      }),
      threadedMessageConfiguration: new ThreadedMessagesConfiguration({
        hideMessageComposer: true,
      }),
      messageComposerConfiguration: new MessageComposerConfiguration({
        hideVoiceRecording: true
      }),
      detailsConfiguration: new DetailsConfiguration({
        addMembersConfiguration: new AddMembersConfiguration({
          onAddMembersButtonClick: function (guid: string, members: CometChat.User[]) {
            const membersRequest = new CometChat.GroupMembersRequestBuilder(guid)
              .setLimit(100)
              .build();

            membersRequest.fetchNext().then(response => {
              const currentCount = response.length;
              if (currentCount + members.length > 6) {
                component.openSnackBar('You can only have up to 5 team members in a group.', 'Close');
              } else {
                  const groupMembers = members.map(u => new CometChat.GroupMember((u as any).uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
                  CometChat.addMembersToGroup(
                    guid,
                    groupMembers,
                    [] // empty bannedMembersList
                  ).then(() => {
                    if (this.onClose) this.onClose(); 
                  });
              }
            });
          },
          usersRequestBuilder: new CometChat.UsersRequestBuilder()
            .setLimit(100)
            .friendsOnly(true)
        })
      })
    })
  }

  startVoiceCall() {
    const context = this.currentChatContext;
    if (context.user) {
      const receiverID = context.user.uid;
      const callType = CometChat.CALL_TYPE.AUDIO;
      const receiverType = CometChat.RECEIVER_TYPE.USER;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Voice call initiation failed:", error)
      );
    } else if (context.group) {
      const receiverID = context.group.guid;
      const callType = CometChat.CALL_TYPE.AUDIO;
      const receiverType = CometChat.RECEIVER_TYPE.GROUP;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Group voice call initiation failed:", error)
      );
    }
  }

  startVideoCall() {
    const context = this.currentChatContext;
    if (context.user) {
      const receiverID = context.user.uid;
      const callType = CometChat.CALL_TYPE.VIDEO;
      const receiverType = CometChat.RECEIVER_TYPE.USER;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Video call initiation failed:", error)
      );
    } else if (context.group) {
      const receiverID = context.group.guid;
      const callType = CometChat.CALL_TYPE.VIDEO;
      const receiverType = CometChat.RECEIVER_TYPE.GROUP;
      this.chatService.callObject = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(this.chatService.callObject).then(
        (call: any) => {
          this.chatService.outGoingCallObject = call;
          this.chatService.callObject = call;
        },
        (error: any) => console.error("Group video call initiation failed:", error)
      );
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(NewGroupDialogComponent, {
      data: {},
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if(result?.group) {
        this.openSnackBar('Group Created successfully!', 'Close');
        this.chatService.isChatAvailable = false;
        setTimeout(() => {
          this.chatService.isChatAvailable = true;
        }, 100);
      }
    });
  }

  private configureTheme(): void {
    const htmlElement = document.querySelector('html');
    if (htmlElement?.classList.contains('dark-theme')) {
      this.themeService.theme.palette.setMode('dark');
    } else {
      this.themeService.theme.palette.setMode('light');
    }
    this.themeService.theme.palette.setPrimary({
      light: '#92b46c',
      dark: '#388E3C'
    });
    this.themeService.theme.typography.setFontFamily('Montserrat, sans-serif');
  }

  private observeAppTheme(): void {
    const htmlElement = document.querySelector('html');
    if (!htmlElement) return;
    this.themeMutationObserver = new MutationObserver(() => {
      this.chatService.isChatAvailable = false;
      setTimeout(() => {
        if (htmlElement.classList.contains('dark-theme')) {
          this.themeService.theme.palette.setMode('dark');
        } else {
          this.themeService.theme.palette.setMode('light');
        }
        this.chatService.isChatAvailable = true;
      }, 100);
    });
    this.themeMutationObserver.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  ngOnDestroy() {
    if (this.themeMutationObserver) {
      this.themeMutationObserver.disconnect();
    }
    if (this.ccActiveChatChanged) {
      this.ccActiveChatChanged.unsubscribe();
    }
    // Remove paste event listener
    document.removeEventListener('paste', this.handlePaste.bind(this));
  }
}
