import React, { useState, useRef, useEffect } from 'react';
import { 
  Headphones, 
  Sparkles, 
  Send, 
  HelpCircle, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  Bot, 
  User, 
  Clock, 
  ArrowRight,
  Plus,
  Compass,
  Coins,
  ShieldCheck,
  Building
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  tableData?: Array<Record<string, string>>;
}

export default function SupportView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello! I am your Anand Rathi Wealth Copilot. I have real-time access to the Jodhpur Branch client logs, investment products, and compliance updates. How can I assist you with your operations today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Support ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('IT_SUPPORT');
  const [ticketStatus, setTicketStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    { label: "Jodhpur Client Summary", query: "Summarize active clients under Jodhpur branch" },
    { label: "Check Sneha's Portfolio", query: "How is Sneha Iyer's portfolio performing?" },
    { label: "Advisory SOP", query: "What is the standard compliance process for high-value fund reallocations?" },
    { label: "New Ticket Status", query: "How do I trace my raised IT-Workstation tickets?" }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Simulate AI thinking and smart responses
    setTimeout(() => {
      let responseText = "";
      let tableData: Array<Record<string, string>> | undefined = undefined;

      const normQuery = query.toLowerCase();

      if (normQuery.includes('jodhpur') || normQuery.includes('branch summary')) {
        responseText = "Based on the latest workstation logs for the newly updated **Jodhpur Hub**, here is an overview of active relationships and operations:";
        tableData = [
          { "Client Name": "Ananya Sharma", "Type": "UHNI", "AUM": "₹12.40 Cr", "Status": "Active" },
          { "Client Name": "Vikram Singh", "Type": "HNI", "AUM": "₹3.20 Cr", "Status": "Active" },
          { "Client Name": "Devendra Goel", "Type": "HNI", "AUM": "₹6.70 Cr", "Status": "Active" },
          { "Total Active AUM": "---", "Branch Hub": "---", "Portfolio Health": "100%", "Status": "Secure" }
        ];
      } else if (normQuery.includes('sneha') || normQuery.includes('iyer')) {
        responseText = "Sneha Iyer is classified as an HNI client registered under Jodhpur/Mumbai cross-coverage. Here are her active portfolio vitals:\n\n" +
          "• **Active AUM**: ₹1.80 Crores\n" +
          "• **Asset Allocation**: 70% Equity Mutual Funds, 30% Debt Instruments\n" +
          "• **Suggested Reallocation**: Due to market parameters, she recently inquired about reallocating 10% of debt to the PP Flexi Cap fund. This transaction can be safely initiated from the *Clients* view or *Portfolio* tab.\n\n" +
          "Would you like me to draft an email briefing for Sneha?";
      } else if (normQuery.includes('compliance') || normQuery.includes('sop') || normQuery.includes('sebi')) {
        responseText = "Under the current SEBI Registered Investment Advisor (RIA) guidelines, high-value transactions (> ₹10 Lakhs) require the following operational steps:\n\n" +
          "1. **Advisory Log**: Submit the suitability analysis checklist to the client.\n" +
          "2. **Acknowledge and Consent**: Obtain explicit client verification via digital signature or secure RM chat.\n" +
          "3. **PML-A Check**: Ensure the client's annual KYC/AML status is clear (sneha Iyer and Amit Patel have 100% verified status).\n" +
          "4. **Execution**: File the allocation update through the *Investments* workflow.";
      } else if (normQuery.includes('ticket') || normQuery.includes('raised')) {
        responseText = "To monitor active support tickets, navigate to the **Workstation Settings** or use the Support Desk widget on this page. All Jodhpur RM tickets are routed directly with high priority (SLA < 2 Hours).";
      } else {
        responseText = `Thank you for reaching out, Nitin! I am scanning the Anand Rathi knowledge database regarding: "${query}".\n\n` +
          "As your workstation assistant, I can help you quickly search client accounts, fetch fund performance figures, review SEBI compliance requirements, or route system tickets directly to Jodhpur IT desk.\n\n" +
          "Try choosing one of the pre-configured quick prompts below for a live demo of my deep client database integration.";
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tableData
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    setTicketStatus('SUCCESS');
    setTimeout(() => {
      // Auto-reply in chat about the raised ticket
      const ticketRef = `AR-TK-${Math.floor(100000 + Math.random() * 900000)}`;
      const aiTicketMsg: Message = {
        id: `ai-ticket-${Date.now()}`,
        sender: 'ai',
        text: `✅ **Ticket Raised Successfully!**\n\nI have logged your request with Reference ID: **${ticketRef}**.\n\n• **Subject**: ${ticketSubject}\n• **Category**: ${ticketCategory.replace('_', ' ')}\n• **SLA response time**: < 15 minutes.\n\nAn IT support associate from the Jodhpur Regional Hub has been assigned to your workstation.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiTicketMsg]);
      
      // Reset form
      setTicketSubject('');
      setTicketDesc('');
      setTicketStatus('IDLE');
    }, 1000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Title & Status Banner */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
            <Headphones className="w-5 h-5 text-brand-gold" /> Need Support & AI Copilot
          </h2>
          <p className="text-[10px] text-brand-text-muted mt-0.5">
            Access immediate operational support, lodge technical tickets, or prompt the intelligent Jodhpur Copilot.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-700">Jodhpur Regional Desk: Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Assistant Chat (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[580px] bg-brand-card-bg border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          {/* AI Header */}
          <div className="px-5 py-4 border-b border-brand-border bg-brand-secondary-bg/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20">
                <Bot className="w-4 h-4 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-brand-text">Wealth Copilot Assistant</h3>
                <p className="text-[9px] text-brand-text-muted">Equipped with Jodhpur Branch & SEBI Suitability database</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-text-muted">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-spin-slow" />
              <span>Model: gemini-3.5-flash</span>
            </div>
          </div>

          {/* Quick suggestions if chat is fresh */}
          <div className="px-5 py-2 bg-brand-secondary-bg/5 border-b border-brand-border/30 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="text-[9px] text-brand-text-muted font-bold uppercase shrink-0">Quick Queries:</span>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p.query)}
                className="text-[10px] bg-brand-primary-bg hover:bg-brand-gold/5 text-brand-text hover:text-brand-gold border border-brand-border hover:border-brand-gold/30 rounded-full px-2.5 py-1 transition-all flex items-center gap-1 font-medium cursor-pointer"
              >
                <Compass className="w-3 h-3" />
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-primary-bg/20">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  m.sender === 'user' 
                    ? 'bg-brand-gold text-white border-brand-gold/20' 
                    : 'bg-brand-card-bg text-brand-gold border-brand-border'
                }`}>
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble Container */}
                <div className="space-y-1.5">
                  <div className={`rounded-2xl p-3.5 text-xs text-left leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-brand-gold text-white rounded-tr-none'
                      : 'bg-brand-card-bg border border-brand-border rounded-tl-none text-brand-text'
                  }`}>
                    {/* Render newlines */}
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Optional Inline Table */}
                    {m.tableData && (
                      <div className="mt-3.5 border border-brand-border/40 rounded-lg overflow-hidden bg-brand-primary-bg/50">
                        <table className="w-full text-[10px] text-brand-text text-left">
                          <thead>
                            <tr className="bg-brand-secondary-bg/30 border-b border-brand-border/40 font-bold">
                              {Object.keys(m.tableData[0]).map((key, ki) => (
                                <th key={ki} className="px-2.5 py-2 text-brand-text uppercase tracking-wider">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {m.tableData.map((row, ri) => (
                              <tr key={ri} className="border-b border-brand-border/20 last:border-0 hover:bg-brand-gold/5 transition-colors">
                                {Object.values(row).map((val, vi) => (
                                  <td key={vi} className={`px-2.5 py-1.5 font-sans ${ri === m.tableData!.length - 1 ? 'font-bold text-brand-gold border-t border-brand-border/30' : ''}`}>
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-[9px] text-brand-text-muted flex items-center gap-1 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <Clock className="w-2.5 h-2.5" />
                    <span>{m.time}</span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-brand-card-bg text-brand-gold border border-brand-border flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-brand-card-bg border border-brand-border rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2">
                  <span className="text-brand-text-muted">Copilot is thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-brand-border bg-brand-card-bg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask me about Jodhpur clients, portfolio analysis, or SEBI compliance..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 text-xs bg-brand-primary-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 font-medium"
              />
              <button
                onClick={() => handleSendMessage()}
                className="bg-brand-gold hover:bg-brand-gold-accent text-white px-4 py-3 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Helpline & System Helpdesk Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Call Directory */}
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border pb-3">
              <Phone className="w-4 h-4 text-brand-gold" /> Jodhpur Hotlines
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg mt-0.5">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text">Jodhpur Corporate Office</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">+91 291 294 8000</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg mt-0.5">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text">Advisory Backoffice Desk</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">ops-jodhpur@rathi.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text">Compliance / RIA Desk</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">compliance-ria@rathi.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Raise Help Ticket */}
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border pb-3">
              <FileText className="w-4 h-4 text-brand-gold" /> Submit Support Ticket
            </h3>

            <form onSubmit={handleTicketSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-bold"
                >
                  <option value="IT_SUPPORT">IT & Workstation Issues</option>
                  <option value="CLIENT_ONBOARDING">Client Onboarding Support</option>
                  <option value="COMPLIANCE_CLEARANCE">Compliance Clearance</option>
                  <option value="MUTUAL_FUNDS_OPS">Mutual Funds & PMS Operations</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Workstation grid latency"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Operational Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe your issue or custom request in detail..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-medium resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-accent text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 hover:shadow cursor-pointer"
              >
                Raise System Ticket
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
