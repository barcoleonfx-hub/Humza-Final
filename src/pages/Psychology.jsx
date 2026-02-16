import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Brain, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const EMOTIONS = [
  'Calm', 'Anxious', 'Frustrated', 'Overconfident', 
  'Fearful', 'Excited', 'Impatient', 'Focused', 
  'Greedy', 'Hesitant', 'Disciplined', 'Doubtful'
];

const fetchDailyContent = async (userId, dateKey, mode) => {
  try {
    // Check if we already have content for today
    const existing = await api.entities.DailyPsychologyContent.filter({
      user_id: userId,
      date_key: dateKey,
      mode: mode
    });

    if (existing.length > 0) {
      return existing[0].selected_items_json;
    }

    // Get all active content for this mode
    const allContent = await api.entities.PsychologyContentLibrary.filter({
      mode: mode,
      is_active: true
    });

    if (allContent.length === 0) {
      // Fallback if no content in library
      return null;
    }

    // Get recently used content (last 7 days) to avoid repeats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentHistory = await api.entities.DailyPsychologyContent.filter({
      user_id: userId,
      mode: mode
    });

    const recentIds = new Set();
    recentHistory.forEach(h => {
      if (h.selected_items_json) {
        h.selected_items_json.forEach(item => recentIds.add(item.id));
      }
    });

    // Filter out recently used items
    let availableContent = allContent.filter(c => !recentIds.has(c.id));
    if (availableContent.length < 3) {
      availableContent = allContent; // Reset if not enough unseen content
    }

    // Select 1 verse/reflection + 1 reminder + 1 prayer (if available)
    const verses = availableContent.filter(c => c.type === 'Verse' || c.type === 'Reflection');
    const reminders = availableContent.filter(c => c.type === 'Reminder');
    const prayers = availableContent.filter(c => c.type === 'Prayer');

    const selected = [];
    if (verses.length > 0) {
      selected.push(verses[Math.floor(Math.random() * verses.length)]);
    }
    if (reminders.length > 0) {
      selected.push(reminders[Math.floor(Math.random() * reminders.length)]);
    }
    if (prayers.length > 0 && mode !== 'Neutral') {
      selected.push(prayers[Math.floor(Math.random() * prayers.length)]);
    }

    // Save selection
    await api.entities.DailyPsychologyContent.create({
      user_id: userId,
      date_key: dateKey,
      mode: mode,
      selected_items_json: selected,
      refresh_count: 0
    });

    return selected;
  } catch (error) {
    console.error('Failed to fetch daily content:', error);
    return null;
  }
};

const getMindsetContent = (mode, prayerTime = null) => {
  const content = {
    neutral: {
      title: "Trading Psychology",
      content: [
        "Your edge comes from discipline, not prediction. The market rewards patience and punishes impulsivity.",
        "Emotions are data points, not decision makers. Observe your feelings without letting them control your actions.",
        "Process over outcomes. Trust your system even when results don't come immediately.",
        "Capital preservation is the foundation of long-term success. Protect what you have before seeking growth.",
        "Every loss is a lesson. Extract the wisdom and move forward with renewed clarity."
      ]
    },
    muslim: {
      title: "Faith & Focus - Islamic Guidance",
      content: [
        `"Indeed, with hardship comes ease." (Quran 94:6) - When trades go against you, remember Allah's promise that relief follows difficulty.`,
        `"And whoever fears Allah - He will make for him a way out and will provide for him from where he does not expect." (Quran 65:2-3)`,
        "اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً - O Allah, I ask You for beneficial knowledge, pure provision, and accepted deeds.",
        "Before opening a trade: رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي (My Lord, expand for me my breast and ease for me my task) - Surah Ta-Ha 20:25-26",
        "When facing loss: حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ (Sufficient for us is Allah, and He is the best Disposer of affairs) - Surah Al-Imran 3:173",
        "Trade with halal intentions and methods. Seek sustenance through discipline, not gambling.",
        prayerTime ? `🕌 Your next prayer (${prayerTime.name}) is at ${prayerTime.time}. Take a break to reconnect with Allah.` : "Remember to pause for your daily prayers. Trading success starts with spiritual balance.",
        "اللَّهُمَّ بَارِكْ لِي فِي رِزْقِي - O Allah, bless me in my provision. Let your earnings be pure and blessed."
      ]
    },
    christian: {
      title: "Faith & Wisdom - Christian Guidance",
      content: [
        "\"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.\" (Jeremiah 29:11)",
        "\"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.\" (Philippians 4:6)",
        "\"Trust in the Lord with all your heart and lean not on your own understanding.\" (Proverbs 3:5)",
        "Before trading: 'Lord, grant me wisdom and discernment. Help me to be a faithful steward of what You've entrusted to me.'",
        "\"The plans of the diligent lead to profit as surely as haste leads to poverty.\" (Proverbs 21:5) - Patience and discipline honor God.",
        "\"For where your treasure is, there your heart will be also.\" (Matthew 6:21) - Keep your focus on eternal values, not temporary gains.",
        "Trade with integrity and wisdom. God blesses those who work diligently and honor Him in their decisions.",
        "In moments of loss: 'Father, help me to see this as an opportunity to grow in character and trust You more deeply.'"
      ]
    },
    jewish: {
      title: "Wisdom & Reflection - Jewish Guidance",
      content: [
        "\"Who is wise? One who learns from every person.\" (Pirkei Avot 4:1) - Every trade teaches you something valuable.",
        "\"The beginning of wisdom is the fear of the Lord.\" (Psalm 111:10) - Trade with reverence and ethical integrity.",
        "\"The one who is slow to anger is better than the mighty, and one whose temper is controlled than one who captures a city.\" (Proverbs 16:32)",
        "Before trading: 'Ribbono shel Olam (Master of the Universe), grant me wisdom to make sound decisions and humility to accept outcomes.'",
        "\"Do not be wise in your own eyes; fear the Lord and shun evil.\" (Proverbs 3:7) - Avoid overconfidence and arrogance.",
        "\"The righteous person falls seven times and rises again.\" (Proverbs 24:16) - Losses are part of the journey. Resilience is the key.",
        "Tikkun Olam - Use your gains to repair the world. Trade not just for profit, but to be a blessing to others.",
        "\"Know before whom you stand.\" Trade with awareness that your actions have spiritual significance."
      ]
    },
    hindu: {
      title: "Dharma & Discipline - Hindu Guidance",
      content: [
        "\"You have the right to work, but never to the fruit of work.\" (Bhagavad Gita 2:47) - Focus on executing your plan, not on profits.",
        "\"A person can rise through the efforts of their own mind; or draw themselves down. The mind is the friend of the conditioned soul, and its enemy as well.\" (Bhagavad Gita 6:5)",
        "Before trading: 'Om Gam Ganapataye Namaha' - Invoke Lord Ganesha to remove obstacles and grant wisdom.",
        "\"When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place.\" (Bhagavad Gita 6:19) - Cultivate inner stillness.",
        "\"The self-controlled soul, who moves amongst sense objects, free from either attachment or repulsion, he wins eternal peace.\" (Bhagavad Gita 2:64)",
        "Trade with detachment. Do not be enslaved by greed or fear. Perform your dharma (duty) with equanimity.",
        "\"Karmanye vadhikaraste ma phaleshu kadachana\" - Your right is to perform your duty only, never to its results.",
        "In loss: Remember karma and the law of cause and effect. Learn, adapt, and continue with discipline."
      ]
    },
    buddhist: {
      title: "Mindfulness & Equanimity - Buddhist Guidance",
      content: [
        "\"Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.\" - Buddha",
        "\"Pain is inevitable. Suffering is optional.\" - Trade losses are inevitable. Emotional suffering over them is a choice.",
        "Before trading: Practice mindful breathing. Observe your thoughts without attachment. Enter the market with a clear, present mind.",
        "\"The root of suffering is attachment.\" - Do not attach your self-worth to trading outcomes.",
        "\"Three things cannot be long hidden: the sun, the moon, and the truth.\" - Be honest with yourself about your mistakes.",
        "\"No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.\" - Take full responsibility for your trading decisions.",
        "Practice the Middle Way - avoid extremes of greed and fear. Trade with balance and equanimity.",
        "\"In the end, only three things matter: how much you loved, how gently you lived, and how gracefully you let go of things not meant for you.\""
      ]
    },
    sikh: {
      title: "Courage & Righteousness - Sikh Guidance",
      content: [
        "\"Recognize the Lord's Light within all, and do not consider social class or status; there are no classes or castes in the world hereafter.\" (Guru Granth Sahib)",
        "\"Through shallow cleverness, the Righteous Judge of Dharma cannot be avoided.\" - Trade with honesty and integrity, not manipulation.",
        "Before trading: Recite 'Waheguru' (Wonderful Lord) - Center yourself in divine presence before making decisions.",
        "\"Fear and greed do not affect one whose mind is filled with the Lord.\" (Guru Granth Sahib) - Trade from a place of inner strength, not anxiety.",
        "\"Truth is high, but higher still is truthful living.\" - Let your trading reflect your values and principles.",
        "Chardi Kala (perpetual optimism) - Maintain a positive, resilient spirit even through losses.",
        "\"One who works for what they eat and gives some of what they have - Nanak, they know the true path.\" - Use your gains to serve others.",
        "Practice Naam Simran (remembrance of God) throughout your trading day. Stay connected to what truly matters."
      ]
    }
  };
  return content[mode] || content.neutral;
};

const PRE_TRADE_CHECKLIST = [
  "I have reviewed my trading plan",
  "I am emotionally neutral and focused",
  "My risk is calculated and within limits",
  "I understand my entry and exit strategy",
  "I am not revenge trading or chasing"
];

export default function Psychology() {
  const [mindsetMode, setMindsetMode] = useState('neutral');
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [intensity, setIntensity] = useState([5]);
  const [checklist, setChecklist] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [dailyContent, setDailyContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.email && mindsetMode) {
      loadDailyContent();
    }
  }, [currentUser, mindsetMode]);

  useEffect(() => {
    if (mindsetMode === 'muslim') {
      fetchPrayerTimes();
    }
  }, [mindsetMode]);

  const loadDailyContent = async () => {
    setLoadingContent(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const content = await fetchDailyContent(currentUser.email, today, mindsetMode);
    setDailyContent(content);
    setLoadingContent(false);
  };

  const handleRefreshContent = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check refresh limit
    const existing = await api.entities.DailyPsychologyContent.filter({
      user_id: currentUser.email,
      date_key: today,
      mode: mindsetMode
    });

    if (existing.length > 0 && existing[0].refresh_count >= 1) {
      alert('You can only refresh content once per day');
      return;
    }

    // Delete existing and reload
    if (existing.length > 0) {
      await api.entities.DailyPsychologyContent.delete(existing[0].id);
    }

    await loadDailyContent();
  };

  const fetchPrayerTimes = async () => {
    try {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `Get today's Islamic prayer times for the user's current location. Return the next upcoming prayer name and time in local format.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            time: { type: "string" }
          }
        }
      });
      setNextPrayer(result);
    } catch (error) {
      console.error('Failed to fetch prayer times:', error);
    }
  };

  const { data: emotionEntries = [] } = useQuery({
    queryKey: ['emotionEntries', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return api.entities.EmotionEntry.filter({ created_by: currentUser.email }, '-created_date', 20);
    },
    enabled: !!currentUser?.email,
  });

  const saveEmotionMutation = useMutation({
    mutationFn: (data) => api.entities.EmotionEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotionEntries'] });
      setSelectedEmotions([]);
      setIntensity([5]);
    },
  });

  const handleSaveEmotions = () => {
    if (selectedEmotions.length === 0) return;
    saveEmotionMutation.mutate({
      emotions: selectedEmotions,
      intensity: intensity[0],
      timestamp: new Date().toISOString()
    });
  };

  const toggleEmotion = (emotion) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const toggleChecklistItem = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const allChecked = PRE_TRADE_CHECKLIST.every(item => checklist[item]);
  const mindsetContent = getMindsetContent(mindsetMode, nextPrayer);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="w-8 h-8 text-green-400" />
          Psychology & Mental Edge
        </h1>
        <p className="text-gray-500 mt-1">Build discipline and emotional awareness</p>
      </div>

      {/* Mindset Mode Selector */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
        <label className="text-sm text-gray-400 mb-3 block">
          Choose the mindset style / faith that helps you most today
        </label>
        <Select value={mindsetMode} onValueChange={setMindsetMode}>
          <SelectTrigger className="bg-card/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neutral">Neutral / General</SelectItem>
            <SelectItem value="muslim">Muslim (Islam)</SelectItem>
            <SelectItem value="christian">Christian</SelectItem>
            <SelectItem value="jewish">Jewish (Judaism)</SelectItem>
            <SelectItem value="hindu">Hindu (Hinduism)</SelectItem>
            <SelectItem value="buddhist">Buddhist</SelectItem>
            <SelectItem value="sikh">Sikh (Sikhism)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Today's Mindset Block */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-green-400" />
            {mindsetContent.title}
          </h2>
          <span className="text-xs text-gray-500">Updated daily</span>
        </div>

        {loadingContent ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Loading today's guidance...</p>
          </div>
        ) : dailyContent && dailyContent.length > 0 ? (
          <div className="space-y-3">
            {dailyContent.map((item, idx) => (
              <div key={idx} className="bg-card/10 rounded-lg p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                    {item.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">{item.content_text}</p>
                    {item.reference_text && (
                      <p className="text-xs text-gray-400 mt-2 italic">{item.reference_text}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button
              onClick={handleRefreshContent}
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              Refresh Today's Content
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mindsetContent.content.map((text, idx) => (
              <div key={idx} className="bg-card/10 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-200">
            This is educational content for trading psychology. Not therapy, not financial advice.
          </p>
        </div>
      </div>

      {/* Emotional Check-In */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-green-400" />
          Emotional Check-In
        </h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-400 mb-3">How are you feeling right now?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => toggleEmotion(emotion)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedEmotions.includes(emotion)
                      ? "bg-green-500 text-black"
                      : "bg-card/5 text-gray-400 hover:bg-card/10"
                  )}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Emotional Intensity</p>
              <span className="text-lg font-bold text-green-400">{intensity[0]}/10</span>
            </div>
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleSaveEmotions}
            disabled={selectedEmotions.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 text-black"
          >
            Save Check-In
          </Button>
        </div>

        {/* Recent Entries */}
        {emotionEntries.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-gray-400 mb-3">Recent Check-Ins</p>
            <div className="space-y-2">
              {emotionEntries.slice(0, 5).map((entry, idx) => (
                <div key={entry.id || idx} className="bg-card/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-2 flex-wrap">
                      {entry.emotions?.map((emotion, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          {emotion}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Intensity: {entry.intensity}/10</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pre-Trade Mental Gate */}
      <div className="glass-card rounded-2xl p-6 bg-[#0f0f17]/80 border border-white/5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Pre-Trade Mental Gate
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Complete this checklist before entering any trade
        </p>

        <div className="space-y-3">
          {PRE_TRADE_CHECKLIST.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggleChecklistItem(item)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left",
                checklist[item]
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-card/5 border-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                checklist[item] ? "bg-green-500 border-green-500" : "border-gray-500"
              )}>
                {checklist[item] && <CheckCircle2 className="w-4 h-4 text-black" />}
              </div>
              <span className="text-sm">{item}</span>
            </button>
          ))}
        </div>

        {allChecked && (
          <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-400 font-medium text-center">
              ✓ Mental gate cleared. You're ready to trade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}