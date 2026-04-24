import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  BookOpen,
  MessageSquare,
  Send,
  X,
  ChevronRight,
  Layers,
  RefreshCw,
  Zap,
  ArrowRight,
  Info,
  LogOut,
  User,
  Settings,
  History,
  LogIn,
  Camera,
  Sun,
  Moon
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FooterQuiz } from "@/components/footer-quiz";
import { getChatResponse } from "./lib/gemini";
import { auth, googleProvider } from "./lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import FlipBook from "./FlipBook";


interface Message {
  role: "user" | "model";
  text: string;
  timestamp?: any;
}

interface UserProfile {
  displayName: string;
  photoURL?: string;
}

interface Law {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string;
  example: string
  imagePrompt: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  title: string;
  definition: string;
  detailedDefinition: string;
  relationship: string;
  meaning: string;
  example: string;
  icon: React.ReactNode;
}

const FEATURE_IMAGES = {
  hero: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1400&q=80",
  overview: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  // categories: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
};

const PhilosophicalParticles = ({ density = 20, className = "" }: { density?: number; className?: string }) => {
  const particles = useMemo(() => {
    return Array.from({ length: density }).map(() => ({
      xInit: `${Math.random() * 100}%`,
      yInit: `${Math.random() * 100}%`,
      scaleInit: Math.random() * 0.5 + 0.5,
      xAnim: `${Math.random() * 10 - 5}%`,
      opacityMax: Math.random() * 0.4 + 0.2,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 3,
    }));
  }, [density]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-primary/30 dark:bg-primary/50 rounded-full blur-[1px]"
          initial={{
            x: p.xInit,
            y: p.yInit,
            opacity: 0,
            scale: p.scaleInit,
          }}
          animate={{
            y: ["0%", "15%", "-15%", "0%"],
            x: ["0%", p.xAnim, "0%"],
            opacity: [0, p.opacityMax, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};
// -------------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Xin chào! Tôi là trợ lý ảo chuyên về Hội nhập kinh tế quốc tế của Việt Nam. Bạn muốn tìm hiểu về nội dung nào hôm nay?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPhotoURL, setNewPhotoURL] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCloudChatEnabled, setIsCloudChatEnabled] = useState(true);
  const experienceUrl =
    typeof window !== "undefined" ? window.location.href : "https://example.com";
  const qrCodeUrl = `..\public\images\\1. QUY LUẬT LƯỢNG - CHẤT (Quy luật về sự chuyển hoá từ những thay đổi về lượng thành những thay đổi về chất và ngược lại) Vị trí của quy luật Chỉ ra cách thức vận động và phát triển của sự vật hiệ.png`;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getLocalProfileKey = (uid: string) => `thbc_profile_${uid}`;
  const getLocalMessagesKey = (uid: string) => `thbc_messages_${uid}`;

  const loadLocalProfile = (currentUser: FirebaseUser): UserProfile => {
    try {
      const raw = localStorage.getItem(getLocalProfileKey(currentUser.uid));
      const saved = raw ? JSON.parse(raw) : {};
      return {
        displayName: saved.displayName || currentUser.displayName || "Người dùng",
        photoURL: saved.photoURL || currentUser.photoURL || ""
      };
    } catch {
      return {
        displayName: currentUser.displayName || "Người dùng",
        photoURL: currentUser.photoURL || ""
      };
    }
  };

  const saveLocalProfile = (uid: string, nextProfile: UserProfile) => {
    localStorage.setItem(getLocalProfileKey(uid), JSON.stringify(nextProfile));
  };

  const getDefaultWelcomeMessage = (): Message[] => ([
    { role: "model", text: "Xin chào! Tôi là trợ lý ảo chuyên về Hội nhập kinh tế quốc tế của Việt Nam. Bạn muốn tìm hiểu về nội dung nào hôm nay?" }
  ]);

  const loadLocalMessages = (uid: string): Message[] => {
    try {
      const raw = localStorage.getItem(getLocalMessagesKey(uid));
      const saved = raw ? JSON.parse(raw) : [];
      return Array.isArray(saved) && saved.length > 0 ? saved : getDefaultWelcomeMessage();
    } catch {
      return getDefaultWelcomeMessage();
    }
  };

  const saveLocalMessages = (uid: string, nextMessages: Message[]) => {
    localStorage.setItem(getLocalMessagesKey(uid), JSON.stringify(nextMessages));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setIsCloudChatEnabled(false);
        setMessages(getDefaultWelcomeMessage());
        return;
      }

      const localProfile = loadLocalProfile(currentUser);
      setProfile(localProfile);
      saveLocalProfile(currentUser.uid, localProfile);
      setIsCloudChatEnabled(false);
      setMessages(loadLocalMessages(currentUser.uid));
    });
    return () => unsubscribe();
  }, []);

  const resetAuthForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRegisterName("");
    setAuthError("");
  };

  const getReadableAuthError = (error: any, mode: "login" | "register") => {
    const code = error?.code;
    const message = error?.message;
    console.log("Parsing error code:", code, message);

    switch (code) {
      case "auth/email-already-in-use":
        return "Email này đã được sử dụng. Hãy đăng nhập hoặc dùng Google nếu bạn đã đăng ký bằng Google.";
      case "auth/account-exists-with-different-credential":
        return "Email này đã tồn tại với phương thức đăng nhập khác. Hãy dùng đúng phương thức trước đó.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-login-credentials":
        return "Email hoặc mật khẩu không chính xác.";
      case "auth/popup-closed-by-user":
        return "Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.";
      case "auth/popup-blocked":
        return "Cửa sổ đăng nhập bị trình duyệt chặn. Hãy cho phép hiển thị popup và thử lại.";
      case "auth/too-many-requests":
        return "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.";
      case "auth/invalid-email":
        return "Email không hợp lệ.";
      case "auth/weak-password":
        return "Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.";
      case "auth/operation-not-allowed":
        return "Đăng nhập Google chưa được bật trong Firebase Console. Hãy kiểm tra cài đặt Authentication.";
      case "auth/unauthorized-domain":
        return "Tên miền này (domain) chưa được thêm vào danh sách 'Authorized domains' trong Firebase Console.";
      default:
        return mode === "register"
          ? "Đăng ký thất bại. Vui lòng thử lại."
          : "Đăng nhập thất bại. Vui lòng thử lại.";
    }
  };

  const handleLogin = () => {
    resetAuthForm();
    setIsAuthDialogOpen(true);
    setAuthMode("login");
  };

  const handleGoogleLogin = async () => {
    console.log("Starting Google Login...");
    setAuthError("");
    setIsAuthSubmitting(true);
    try {
      console.log("Calling signInWithPopup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login success:", result.user.email);
      setIsAuthDialogOpen(false);
      resetAuthForm();
      toast.success("Đăng nhập thành công!");
    } catch (error: any) {
      console.error("Google login failed details:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        customData: error?.customData
      });
      if (error?.code === "auth/account-exists-with-different-credential") {
        setAuthError("Email này đã đăng ký bằng mật khẩu. Hãy đăng nhập bằng email và mật khẩu trước.");
      } else {
        setAuthError(getReadableAuthError(error, "login") + ` (${error?.code || 'unknown'})`);
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setAuthError("");

    if (!normalizedEmail) {
      setAuthError("Vui lòng nhập email.");
      return;
    }

    if (authMode === "register") {
      if (password !== confirmPassword) {
        setAuthError("Mật khẩu xác nhận không khớp.");
        return;
      }
      if (password.length < 6) {
        setAuthError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      if (!registerName.trim()) {
        setAuthError("Vui lòng nhập tên của bạn.");
        return;
      }
    }

    setIsAuthSubmitting(true);

    try {
      if (authMode === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await updateProfile(userCredential.user, {
          displayName: registerName.trim()
        });

        const nextProfile = {
          displayName: registerName.trim(),
          photoURL: userCredential.user.photoURL || ""
        };

        saveLocalProfile(userCredential.user.uid, nextProfile);
        setProfile(nextProfile);

        setIsAuthDialogOpen(false);
        resetAuthForm();
        toast.success("Đăng ký thành công!");
        return;
      }

      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      setIsAuthDialogOpen(false);
      resetAuthForm();
      toast.success("Đăng nhập thành công!");
    } catch (error: any) {
      console.error(`${authMode} failed`, error);
      setAuthError(getReadableAuthError(error, authMode));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setAuthError("Hãy nhập email trước khi yêu cầu đặt lại mật khẩu.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      toast.success("Đã gửi email đặt lại mật khẩu.");
    } catch (error: any) {
      console.error("Reset password failed", error);
      setAuthError(getReadableAuthError(error, "login"));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsChatOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const uploadToCloudinary = async (dataUrl: string) => {
    const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing");
    }

    const formData = new FormData();
    formData.append("file", dataUrl);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Cloudinary upload error response:", errorData);
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleUpdateProfile = async () => {
    if (!user || !newDisplayName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      let photoURL = newPhotoURL.trim() || profile?.photoURL || "";

      if (photoURL.startsWith("data:image/")) {
        photoURL = await uploadToCloudinary(photoURL);
      }

      const updatedProfile = {
        displayName: newDisplayName.trim(),
        photoURL
      };

      await updateProfile(user, updatedProfile);
      saveLocalProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
      setIsProfileDialogOpen(false);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error("Update profile failed", error);
      toast.error("Cập nhật hồ sơ thất bại.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const appendLocalMessage = (message: Message) => {
    setMessages(prev => {
      const next = [...prev, message];
      if (user) {
        saveLocalMessages(user.uid, next);
      }
      return next;
    });
  };

  const saveMessageToFirestore = async (_message: Message) => false;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    const newMessage: Message = { role: "user", text: userMessage };

    setInputValue("");
    setIsLoading(true);

    appendLocalMessage(newMessage);

    const history = [...messages, newMessage].map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const response = await getChatResponse(userMessage, history);
      const modelMessage: Message = { role: "model", text: response || "Xin lỗi, tôi không thể trả lời lúc này." };

      appendLocalMessage(modelMessage);

    } catch (error) {
      console.error("Handle send message failed", error);
      appendLocalMessage({
        role: "model",
        text: "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" richColors />
      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-xl font-serif font-bold">Kinh Tế Hội Nhập</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6 mr-4 border-r pr-6">
              <a href="#overview" className="text-sm font-medium hover:text-primary transition-colors">Tổng quan</a>
              <a href="#impacts" className="text-sm font-medium hover:text-primary transition-colors">Tác động</a>
              <a href="#directions" className="text-sm font-medium hover:text-primary transition-colors">Phương hướng</a>
              <a href="#flipbook" className="text-sm font-medium hover:text-primary transition-colors">Câu chuyện Hội nhập</a>
              <a href="#review" className="text-sm font-medium hover:text-primary transition-colors">Ôn tập</a>
              <a href="#qr" className="text-sm font-medium hover:text-primary transition-colors">QR Code</a>
              {/* <a href="#categories" className="text-sm font-medium hover:text-primary transition-colors">Phạm trù</a> */}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-9 h-9">
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "relative h-9 w-9 rounded-full p-0")}>
                    <Avatar className="h-9 w-9 border border-primary/10">
                      <AvatarImage src={profile?.photoURL || user.photoURL || ""} alt={profile?.displayName || ""} />
                      <AvatarFallback>{(profile?.displayName || user.displayName || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{profile?.displayName || user.displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setNewDisplayName(profile?.displayName || user.displayName || "");
                      setNewPhotoURL(profile?.photoURL || user.photoURL || "");
                      setIsProfileDialogOpen(true);
                    }}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Tùy chỉnh hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsChatOpen(true)}>
                      <History className="mr-2 h-4 w-4" />
                      <span>Lịch sử trò chuyện</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} variant="destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="default" size="sm" onClick={handleLogin} className="rounded-full px-5 h-9">
                  <LogIn className="mr-2 h-4 w-4" /> Đăng nhập
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)} className="rounded-full h-9">
                Hỏi Chatbot
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-x-hidden">
        {/* Hero Section */}
        <section
          id="intro"
          className="relative pt-32 pb-24 overflow-hidden z-10 bg-fixed bg-center bg-cover"
          style={{ backgroundImage: 'url("/images/Section1.png")' }}
        >
          {/* LỚP PHỦ THÔNG MINH: 
      - Light mode: bg-black/10 (phủ một lớp đen siêu mỏng 10% để ảnh giữ nguyên màu sắc gốc nhưng vẫn hỗ trợ đọc chữ)
      - Dark mode: dark:bg-background/40 (phủ lớp tối hơn để hợp với giao diện đêm)
  */}
          <div className="absolute inset-0 bg-black/10 dark:bg-background/40 backdrop-blur-[0.5px] -z-10" />

          {/* Giữ nguyên hiệu ứng hạt lá lơi nhưng giảm opacity để không lấn át ảnh nền */}
          <PhilosophicalParticles density={25} className="-z-10 opacity-50" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* 1. Badge: Đổi text-primary thành text-white và border-primary thành border-white/40 */}
                <Badge variant="outline" className="mb-8 px-4 py-1 border-white/40 text-white font-medium tracking-wider uppercase text-[10px] drop-shadow-sm">
                  Triết học Mác - Lênin
                </Badge>

                {/* 2. Tiêu đề chính (h1): Thêm text-white và drop-shadow-lg */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl mb-0.5 leading-[0.9] tracking-tight font-serif italic text-white drop-shadow-lg">
                  <div className="leading-29">
                    HỘI NHẬP KINH TẾ QUỐC TẾ CỦA VIỆT NAM
                  </div>
                  <br className="hidden md:block" />
                  {/* Duy Vật: Đổi text-primary thành text-white */}
                </h1>

                {/* 3. Đoạn mô tả (p): Đổi text-black thành text-white cố định */}
                <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto mb-12 font-sans font-medium leading-relaxed drop-shadow-xl">
                  Quá trình quốc gia đó thực hiện gắn kết nền kinh tế của mình với nền kinh tế thế giới dựa trên sự chia sẻ lợi ích đồng thời tuân thủ các chuẩn mực quốc tế chung.
                </p>

                <div className="max-w-4xl mx-auto mb-12 overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 dark:bg-zinc-900/50 shadow-2xl backdrop-blur-sm">
                  <img
                    src={FEATURE_IMAGES.hero}
                    alt="Không gian học tập triết học"
                    className="h-[260px] md:h-[360px] w-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  <a
                    href="#overview"
                    className={cn(buttonVariants({ size: "lg", variant: "default" }), "rounded-full px-10 h-14 text-base shadow-lg shadow-primary/20 flex items-center justify-center")}
                  >
                    Bắt đầu tìm hiểu <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                  <a
                    href="#flipbook"
                    className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-10 h-14 text-base border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm")}
                  >
                    Mở Flipbook
                  </a>
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-base border-primary/20 hover:bg-primary/5" onClick={() => setIsChatOpen(true)}>
                    Trò chuyện với AI
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
       ;

        <section
          id="overview"
          className="py-24 relative z-10 bg-center bg-cover"
          style={{ backgroundImage: 'url("/images/Section2.png")' }}
        >
          {/* Lớp phủ chuyển sắc từ trên xuống dưới */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/70 dark:from-zinc-950/90 dark:to-zinc-950/80 backdrop-blur-md -z-10" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center max-w-5xl mx-auto">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-4">Tổng quan</Badge>
                <h2 className="text-4xl md:text-5xl font-serif italic mb-8">Khái niệm và nội dung hội nhập kinh tế quốc tế
                </h2>
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/50 dark:bg-zinc-900 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Khái niệm và sự cần thiết khách quan</h4>
                      <div>
                        <p className="text-muted-foreground leading-relaxed">
                          <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
                            <li>
                              <ul className="list-disc pl-6 mt-1 space-y-1">
                                <li>Tự do hóa các hoạt động kinh tế.</li>
                                <li>Mở cửa thị trường.</li>
                                <li>Tham gia các định chế kinh tế quốc tế.</li>
                              </ul>
                            </li>
                            <li>
                              <span className="font-semibold">Sự cần thiết:</span>
                              <ul className="list-disc pl-6 mt-1 space-y-1">
                                <li>Tận dụng nguồn lực bên ngoài (vốn, công nghệ, quản lý).</li>
                                <li>Mở rộng thị trường xuất khẩu.</li>
                                <li>Thúc đẩy cải cách thể chế trong nước.</li>
                              </ul>
                            </li>
                          </ul>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/50 dark:bg-zinc-900 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Tính tất yếu khách quan</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
                          <li>
                            <span className="font-semibold">Xu thế toàn cầu hóa: </span>
                            <span>Đây là xu thế không thể đảo ngược; quốc gia đứng ngoài sẽ bị tụt hậu.</span>
                          </li>
                          <li>
                            <span className="font-semibold">Sự phát triển của Lực lượng sản xuất: </span>
                            <span>CMCN 4.0 thúc đẩy sự phân công lao động quốc tế diễn ra mạnh mẽ.</span>
                          </li>
                          <li>
                            <span className="font-semibold">Giải quyết các vấn đề toàn cầu: </span>
                            <span>Biến đổi khí hậu, dịch bệnh, an ninh năng lượng đòi hỏi sự hợp tác quốc tế.</span>
                          </li>
                        </ul>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl" />
                <div className="relative bg-secondary/20 dark:bg-zinc-900/50 border border-primary/5 p-10 rounded-[3rem] backdrop-blur-sm">
                  <div className="mb-8 overflow-hidden rounded-[2rem] border border-primary/10">
                    <img src={FEATURE_IMAGES.overview} alt="Sách và ghi chú học tập" className="h-56 w-full object-cover" />
                  </div>
                  <h4 className="text-2xl font-serif italic mb-6">Cấu trúc nội dung cốt lõi</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-primary/5">
                      <span className="font-medium text-sm">Khái niệm và nội dung</span>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none">Phần 1</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-primary/5">
                      <span className="font-medium text-sm">Tác động của hội nhập</span>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none">Phần 2</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-primary/5">
                      <span className="font-medium text-sm">Phương hướng nâng cao</span>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none">Phần 3</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="impacts"
          className="py-32 relative z-10 bg-fixed bg-center bg-cover"
          style={{ backgroundImage: 'url("/images/Section3.png")' }}
        >
          <div className="absolute inset-0 bg-secondary/80 dark:bg-zinc-900/90 backdrop-blur-lg -z-10" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-4">Phần 2</Badge>
              <h2 className="text-4xl md:text-5xl mb-6 font-serif italic">Tác động của hội nhập kinh tế quốc tế</h2>
              <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
              <p className="text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto text-lg font-light">
                Đánh giá những ảnh hưởng đa chiều của quá trình hội nhập đến sự phát triển của Việt Nam.
              </p>
            </div>

            <div className="max-w-5xl mx-auto overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-950 shadow-2xl border border-primary/5">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-primary/10">
                <div className="p-10 lg:p-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600">Tác Động Tích Cực</h3>
                  </div>
                  <ul className="space-y-6">
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Tăng trưởng kinh tế</p>
                        <p className="text-muted-foreground">Thúc đẩy GDP, mở rộng thị trường xuất khẩu (nông sản, dệt may, điện tử).</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Thu hút FDI</p>
                        <p className="text-muted-foreground">Tiếp nhận vốn, công nghệ hiện đại và phương thức quản trị tiên tiến.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Nâng cao trình độ nhân lực</p>
                        <p className="text-muted-foreground">Tạo môi trường cọ xát, học hỏi kỹ năng nghề nghiệp quốc tế.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Hoàn thiện thể chế</p>
                        <p className="text-muted-foreground">Tạo sức ép cải cách hành chính, minh bạch hóa pháp luật theo chuẩn mực chung.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="p-10 lg:p-12 bg-red-500/[0.02]">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <X className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600">Tác Động Tiêu Cực</h3>
                  </div>
                  <ul className="space-y-6">
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Gia tăng cạnh tranh</p>
                        <p className="text-muted-foreground">Nhiều doanh nghiệp nội địa yếu kém đứng trước nguy cơ phá sản.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Rủi ro phụ thuộc</p>
                        <p className="text-muted-foreground">Kinh tế dễ bị tổn thương trước các biến động chính trị/kinh tế thế giới.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Phân hóa giàu nghèo</p>
                        <p className="text-muted-foreground">Khoảng cách thu nhập giữa các vùng miền và nhóm dân cư gia tăng.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <p className="font-bold text-lg mb-1">Thách thức về an ninh</p>
                        <p className="text-muted-foreground">Nguy cơ chuyển dịch công nghệ lạc hậu và ô nhiễm môi trường vào trong nước.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}

        <section
          id="directions"
          className="py-32 bg-gradient-to-b from-background via-secondary/10 to-background dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_40%)]" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-4">Phần 3</Badge>
                <h2 className="text-4xl md:text-5xl mb-6 font-serif italic">Phương hướng nâng cao hiệu quả hội nhập</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto text-lg font-light leading-relaxed">
                  Các giải pháp chiến lược nhằm tối ưu hóa lợi ích và hạn chế rủi ro trong quá trình hội nhập quốc tế của Việt Nam.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 6.2.3.1 */}
                <div className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                    <Info className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Nhận thức về thời cơ & thách thức</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Hội nhập không phải là "thẻ bài vạn năng" mà là môi trường rèn luyện. Cần thấy rõ cả Cơ hội và Thách thức để chuẩn bị tâm thế chủ động.
                  </p>
                </div>

                {/* 6.2.3.2 */}
                <div className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Chiến lược & lộ trình phù hợp</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Xác định rõ các lĩnh vực ưu tiên và lộ trình mở cửa có tính toán. Hội nhập toàn diện từ kinh tế đến chính trị, văn hóa, quốc phòng.
                  </p>
                </div>

                {/* 6.2.3.3 */}
                <div className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                    <RefreshCw className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Chủ động liên kết quốc tế</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Thực hiện nghiêm túc các cam kết (WTO, CPTPP, EVFTA...). Chuyển từ "tham gia" sang "chủ động đóng góp", xây dựng luật chơi chung.
                  </p>
                </div>

                {/* 6.2.3.4 */}
                <div className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Hoàn thiện thể chế & pháp luật</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Đồng bộ hóa hệ thống pháp luật với các cam kết quốc tế. Cải cách hành chính, giảm chi phí tuân thủ cho doanh nghiệp.
                  </p>
                </div>

                {/* 6.2.3.5 */}
                <div className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Nâng cao năng lực cạnh tranh</h4>
                  <ul className="text-muted-foreground text-xs space-y-2">
                    <li>• Cấp quốc gia: Cải thiện môi trường kinh doanh.</li>
                    <li>• Cấp doanh nghiệp: Đổi mới công nghệ, thương hiệu.</li>
                    <li>• Cấp sản phẩm: Tiêu chuẩn chất lượng (ESG, chứng chỉ xanh).</li>
                  </ul>
                </div>

                {/* 6.2.3.6 */}
                <div className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                    <Settings className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-4">Kinh tế độc lập, tự chủ</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Hội nhập sâu càng cần tự chủ để không bị "hòa tan". Làm chủ các ngành then chốt và đa dạng hóa quan hệ để tránh phụ thuộc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="flipbook"
          className="py-32 bg-gradient-to-b from-background via-secondary/10 to-background dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_40%)]" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-4">ltranh tương tác</Badge>
                <h2 className="text-4xl md:text-5xl mb-6 font-serif italic">Con đường Hội nhập của Việt Nam</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto text-lg font-light leading-relaxed">
                  Theo chân hành trình lật mở những trang sử kinh tế, từ những ngày đầu mở cửa đến khát vọng kiến tạo giá trị Việt trên thị trường toàn cầu.
                </p>
              </div>

              <div id="flipbook-reader" className="rounded-[2rem] border border-primary/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-2xl shadow-primary/5 p-4 md:p-8">
                <FlipBook />
              </div>
            </div>
          </div>
        </section>

        

      </main>

      <footer className="py-20 border-t bg-white dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,var(--color-primary)_0%,transparent_70%)] opacity-[0.02]" />
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
          <div className="text-center mb">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-4">Ôn tập</Badge>
                <h2 className="text-4xl md:text-5xl mb-6 font-serif italic">Ôn tập kiến thức</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto text-lg font-light leading-relaxed">
                   Mọi người cố gắng trả lời hết nhé!!!
                </p>
              </div>
            <Separator className="max-w-xs mx-auto mb-10 opacity-50" />

            <FooterQuiz />

            <div
              id="qr"
              className="mt-12 w-full max-w-4xl rounded-[2rem] border border-primary/10 bg-primary/[0.03] p-6 md:p-10"
            >
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-4">
                Quá đẹp cho một trang web
              </Badge>
              <h3 className="text-3xl md:text-4xl font-serif italic mb-4">
                Thỏa sức trải nghiệm
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-8">
                Quét mã 
              </p>
              <div className="mx-auto w-full max-w-[280px] rounded-[1.5rem] border border-primary/10 bg-white p-4 shadow-xl">
                <img
                  src="/images/QRCode.png"
                  alt="Ma QR truy cap trang web"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>

            <Separator className="max-w-xs mx-auto mt-12 mb-6 opacity-50" />
            <p className="text-sm text-muted-foreground">© 2026 — Kiến thức về hội nhập kinh tế quốc tế của Việt Nam.</p>
          </div>
        </div>
      </footer>

      {/* Chatbot Toggle Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-[0_0_20px_rgba(230,81,0,0.5)] z-50 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white flex items-center gap-2 transition-all duration-300 hover:scale-105 animate-pulse"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-bold text-sm tracking-wide">AI Hội Nhập</span>
      </Button>

      {/* Chatbot Interface */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 w-[95vw] md:w-[600px] h-[80vh] max-h-[800px] z-50 flex flex-col bg-white dark:bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden border border-primary/5"
          >
            <div className="p-6 bg-gradient-to-br from-white to-orange-50 dark:from-zinc-950 dark:to-zinc-900 border-b border-orange-100/50 dark:border-orange-900/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user ? (
                    <Avatar className="w-12 h-12 rounded-2xl border-2 border-white shadow-lg shadow-orange-100 dark:shadow-none">
                      <AvatarImage src={profile?.photoURL || user.photoURL || ""} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        <User className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <p className="font-serif font-bold text-lg leading-none mb-1 text-zinc-900 dark:text-zinc-100">
                    Kinh Tế AI
                  </p>
                  {user && (
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wider">
                      Chào, {profile?.displayName || user.displayName?.split(' ')[0]}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-colors" onClick={() => setIsChatOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-secondary/[0.02] custom-scrollbar">
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-primary text-white dark:text-zinc-950 rounded-tr-none shadow-lg shadow-primary/20"
                      : "bg-white dark:bg-card text-foreground rounded-tl-none shadow-sm border border-primary/5"
                      }`}>
                      <div className={cn("prose prose-sm max-w-none", msg.role === "user" ? "prose-invert" : "prose-slate dark:prose-invert")}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-card p-4 rounded-[1.5rem] rounded-tl-none shadow-sm border border-primary/5 flex gap-1.5">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-primary/5">
              <form
                className="flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input
                  placeholder="Nhập câu hỏi cho chatbot"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 h-12 rounded-full px-6 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20 focus-visible:border-primary/20 transition-all"
                />
                <Button type="submit" size="icon" className="w-12 h-12 rounded-full shadow-lg shadow-primary/20" disabled={isLoading || !inputValue.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium tracking-wide opacity-60">
                Sử dụng trí tuệ nhân tạo để hỗ trợ học tập
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Profile Customization Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Tùy chỉnh hồ sơ</DialogTitle>
            <DialogDescription>
              Thay đổi tên hiển thị và ảnh đại diện của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-primary/10">
                  <AvatarImage src={newPhotoURL || profile?.photoURL || user?.photoURL || ""} />
                  <AvatarFallback className="text-2xl">{(newDisplayName || user?.displayName || "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewPhotoURL(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium px-1">Tên hiển thị</label>
              <Input
                id="name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="rounded-full h-12 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="photo" className="text-sm font-medium px-1">URL Ảnh đại diện</label>
              <Input
                id="photo"
                value={newPhotoURL}
                onChange={(e) => setNewPhotoURL(e.target.value)}
                placeholder="https://..."
                className="rounded-full h-12 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)} className="rounded-full">Hủy</Button>
            <Button onClick={handleUpdateProfile} className="rounded-full px-8" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Authentication Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={(open) => { setIsAuthDialogOpen(open); if (!open) resetAuthForm(); }}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white text-center">
            <h2 className="text-3xl font-serif italic mb-2">
              {authMode === "login" ? "Chào mừng trở lại" : "Tham gia cùng chúng tôi"}
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              {authMode === "login" ? "Đăng nhập để tiếp tục học tập" : "Tạo tài khoản để lưu trữ lịch sử trò chuyện"}
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-950">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Họ và tên</label>
                  <Input
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="rounded-xl h-12 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="rounded-xl h-12 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mật khẩu</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-12 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20"
                  required
                />
              </div>

              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Xác nhận mật khẩu</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl h-12 bg-secondary/20 dark:bg-zinc-900 border-transparent focus-visible:ring-primary/20"
                    required
                  />
                </div>
              )}

              {authError && (
                <p className="text-destructive text-xs font-medium bg-destructive/10 p-3 rounded-xl">
                  {authError}
                </p>
              )}

              <Button type="submit" disabled={isAuthSubmitting} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
                {isAuthSubmitting ? "Đang xử lý..." : authMode === "login" ? "Đăng nhập" : "Đăng ký"}
              </Button>
              {authMode === "login" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full text-right text-xs font-medium text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
              )}
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-secondary dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-4 text-muted-foreground font-bold tracking-widest">Hoặc</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isAuthSubmitting}
              className="w-full h-12 rounded-xl border-secondary dark:border-zinc-800 hover:bg-secondary/10 flex items-center justify-center gap-3 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Tiếp tục với Google
            </Button>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              {authMode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button
                    onClick={() => { setAuthMode("register"); setAuthError(""); }}
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button
                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
