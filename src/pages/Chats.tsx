import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, X, File, Image as ImageIcon, FileText, Download, Search, Loader2, Check, CheckCheck } from 'lucide-react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { toast } from '@/hooks/use-toast';

export default function Chats() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessageReceived = useCallback(() => {
    fetchThreads();
    if (selectedThread) {
      fetchMessages(selectedThread);
    }
  }, [selectedThread]);

  // Real-time message updates
  useRealtimeMessages(handleMessageReceived);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time typing indicators
  useEffect(() => {
    if (!selectedThread || !user) return;

    const typingChannel = supabase
      .channel(`typing:${selectedThread}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `job_id=eq.${selectedThread}`,
        },
        (payload) => {
          const typingData = payload.new as any;
          if (typingData && typingData.user_id !== user.id) {
            setOtherUserTyping(typingData.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [selectedThread, user]);

  // Search messages
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter((msg: any) =>
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery, messages]);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
    }
  }, [selectedThread]);

  const fetchThreads = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        job_id, 
        jobs(title), 
        sender_id, 
        recipient_id,
        sender:profiles!messages_sender_id_fkey(full_name),
        recipient:profiles!messages_recipient_id_fkey(full_name)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      // Group by job_id and get unique threads
      const uniqueThreads = data.reduce((acc: any[], msg: any) => {
        if (!acc.find(t => t.job_id === msg.job_id)) {
          acc.push(msg);
        }
        return acc;
      }, []);
      setThreads(uniqueThreads);
    }
  };

  const fetchMessages = async (jobId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name)')
      .eq('job_id', jobId)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      setFilteredMessages(data);
      
      // Mark messages as read
      const unreadMessages = data.filter(
        (msg: any) => msg.recipient_id === user.id && !msg.read_at
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map((msg: any) => msg.id));
      }
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!selectedThread || !user) return;

    // Update typing status
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!selectedThread || !user) return;

    await supabase
      .from('typing_status')
      .upsert({
        job_id: selectedThread,
        user_id: user.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'job_id,user_id'
      });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploadingFile(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedThread) return;
    if (!newMessage.trim() && !selectedFile) return;

    const thread = threads.find(t => t.job_id === selectedThread);
    const recipientId = thread.sender_id === user.id ? thread.recipient_id : thread.sender_id;

    let mediaUrl = null;
    let attachmentName = null;
    let attachmentType = null;
    let attachmentSize = null;

    // Upload file if selected
    if (selectedFile) {
      mediaUrl = await uploadFile();
      if (!mediaUrl) return; // Upload failed
      
      attachmentName = selectedFile.name;
      attachmentType = selectedFile.type;
      attachmentSize = selectedFile.size;
    }

    const { error } = await supabase.from('messages').insert({
      job_id: selectedThread,
      sender_id: user.id,
      recipient_id: recipientId,
      content: newMessage.trim() || (selectedFile ? `Sent ${selectedFile.name}` : ''),
      media_url: mediaUrl,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      attachment_size: attachmentSize,
    });

    if (!error) {
      setNewMessage('');
      setSelectedFile(null);
      setIsTyping(false);
      updateTypingStatus(false);
      fetchMessages(selectedThread);
      
      // Create notification for recipient
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message',
        title: 'New Message',
        message: `You have a new message about "${thread.jobs?.title}"`,
        link: '/chats',
      });
    }
  };

  const downloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type?.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container max-w-7xl py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <Card className="h-[700px]">
        <div className="grid grid-cols-12 h-full">
          {/* Thread List */}
          <div className="col-span-4 border-r">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-4 space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.job_id}
                    onClick={() => {
                      setSelectedThread(thread.job_id);
                      setSearchQuery('');
                    }}
                    className={`w-full p-3 rounded-lg text-left hover:bg-accent transition-colors ${
                      selectedThread === thread.job_id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {thread.sender_id === user?.id
                            ? thread.recipient?.full_name?.[0] || 'U'
                            : thread.sender?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{thread.jobs?.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {thread.sender_id === user?.id
                            ? thread.recipient?.full_name
                            : thread.sender?.full_name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {threads.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No conversations yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="col-span-8 flex flex-col">
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {threads.find(t => t.job_id === selectedThread)?.jobs?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {threads.find(t => t.job_id === selectedThread)?.sender_id === user?.id
                          ? threads.find(t => t.job_id === selectedThread)?.recipient?.full_name
                          : threads.find(t => t.job_id === selectedThread)?.sender?.full_name}
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {/* Message Content */}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Attachment */}
                          {message.media_url && (
                            <div className="mt-2">
                              {message.attachment_type?.startsWith('image/') ? (
                                <img
                                  src={message.media_url}
                                  alt={message.attachment_name}
                                  className="max-w-full rounded-lg cursor-pointer"
                                  onClick={() => window.open(message.media_url, '_blank')}
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-2 rounded bg-background/10">
                                  {getFileIcon(message.attachment_type)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {message.attachment_name}
                                    </p>
                                    <p className="text-xs opacity-70">
                                      {formatFileSize(message.attachment_size)}
                                    </p>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => downloadAttachment(message.media_url, message.attachment_name)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Timestamp and Read Receipt */}
                          <div className="flex items-center gap-1 mt-1">
                            <p className="text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                            {message.sender_id === user?.id && (
                              <span className="text-xs opacity-70">
                                {message.read_at ? (
                                  <CheckCheck className="h-3 w-3 inline" />
                                ) : (
                                  <Check className="h-3 w-3 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {otherUserTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <CardContent className="border-t p-4">
                  {/* File Preview */}
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-accent rounded-lg flex items-center gap-2">
                      {getFileIcon(selectedFile.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={uploadingFile}
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={uploadingFile || (!newMessage.trim() && !selectedFile)}
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">No conversation selected</p>
                  <p className="text-sm">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
