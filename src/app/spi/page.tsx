import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { t, type Locale } from "@/lib/i18n";

export default async function SpiPage() {
  const locale = await getLocale();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-24 pt-6 md:px-8 md:py-12">
      <Link
        href="/"
        className="text-sm text-slate-400 hover:text-white w-fit"
      >
        ← {t(locale, "backToHome")}
      </Link>

      {locale === "zh" ? <ChineseArticle /> : <EnglishArticle />}
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 text-xl md:text-2xl font-display font-semibold text-white">
      {children}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm md:text-base leading-relaxed text-slate-200">
      {children}
    </p>
  );
}

function ChineseArticle() {
  return (
    <article className="space-y-4 md:space-y-5">
      <header className="space-y-3 md:space-y-4">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-primary">
          Spotify Popularity Index
        </p>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-semibold text-white">
          什么是 Spotify Popularity Index（SPI）？
        </h1>
        <p className="text-sm md:text-base text-slate-300">
          以及为什么它比「总播放量」更值得你关注
        </p>
      </header>

      <Paragraph>
        如果你在意作品在海外的真实传播效果，Spotify 上的{" "}
        <strong className="font-semibold text-white">
          SPI（Spotify Popularity Index）
        </strong>{" "}
        是一个一定要认识的数字。
      </Paragraph>

      <Paragraph>
        SPI 是 Spotify 给{" "}
        <strong className="font-semibold text-white">每一首歌</strong> 和{" "}
        <strong className="font-semibold text-white">每一位音乐人</strong>{" "}
        打的一个 <strong className="font-semibold text-white">0–100</strong>{" "}
        的实时热度分。分数越高，说明你在{" "}
        <strong className="font-semibold text-white">「现在」这段时间</strong>
        越受欢迎。
      </Paragraph>

      <SectionTitle>它和「总播放量」有什么不一样？</SectionTitle>

      <ul className="list-disc space-y-2 pl-5 text-sm md:text-base text-slate-200">
        <li>
          <strong>SPI 不是总播放量。</strong> 一首 10 年前的歌，就算累积了
          1000 万次播放，如果最近几周几乎没人再听，它的 SPI 依然会很低。
        </li>
        <li>
          <strong>SPI 看的是当下的表现。</strong> 一首刚发的新歌，总播放也许不到
          5000，但如果大部分播放都集中在最近几天，很多人循环、收藏、加歌单，它的
          SPI 可能已经冲到 20 分甚至更高。
        </li>
      </ul>

      <Paragraph>
        可以把 SPI 理解成：
        <br />
        <span className="mt-2 inline-block rounded-2xl bg-slate-800/80 px-3 py-2 text-sm text-slate-100">
          「在最近这段时间，有多少真实听众，持续地、主动地和你的音乐发生互动？」
        </span>
      </Paragraph>

      <SectionTitle>为什么 SPI 这么关键？</SectionTitle>

      <Paragraph>
        在推荐逻辑里，Spotify 更关心的问题不是：
        <br />
        <span className="mt-1 inline-block text-slate-300">
          “这首歌这一辈子被听了多少次？”
        </span>
      </Paragraph>
      <Paragraph>
        而是：
        <br />
        <span className="mt-1 inline-block text-slate-300">
          “<strong>最近</strong> 有哪些歌正在被大量真实用户喜欢？”
        </span>
      </Paragraph>

      <Paragraph>SPI 就是这个问题的直接答案。</Paragraph>

      <Paragraph>
        想象一下 Spotify 算法的心声：
      </Paragraph>

      <ul className="list-disc space-y-2 pl-5 text-sm md:text-base text-slate-200">
        <li>
          <strong>当 SPI 很低（0–15）时：</strong> “这首歌有人听，但没有特别的信号，先安静地放在那儿。” 歌曲主要出现在你自己的主页、歌单和老听众的历史里，对陌生听众几乎是「隐形」的。
        </li>
        <li>
          <strong>当 SPI 被推高到一个阈值（例如 20 分以上）时：</strong>{" "}
          “这首歌最近的热度在快速上升，很多人喜欢、收藏、加歌单，我应该把它推荐给更多口味相似的听众。”
        </li>
      </ul>

      <Paragraph>
        这时，Spotify 才会启动真正有价值的{" "}
        <strong className="font-semibold text-white">免费推荐流量</strong>，
        例如：
      </Paragraph>

      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>Discover Weekly 每周发现</li>
        <li>Release Radar 新歌雷达</li>
        <li>Spotify Radio 电台推荐 等等</li>
      </ul>

      <Paragraph>
        一旦这个推荐引擎被触发，你的作品就会开始源源不断地被完全陌生的新听众听到，而不是只在自己的小圈子里打转。
      </Paragraph>

      <SectionTitle>作为音乐人，我可以怎么主动影响 SPI？</SectionTitle>

      <Paragraph>
        核心思路只有一句话：
        <br />
        <span className="mt-2 inline-block rounded-2xl bg-slate-800/80 px-3 py-2 text-sm text-slate-100">
          让更多「真正可能会喜欢这首歌的人」，在短时间内集中听到它，并愿意收藏 /
          加歌单 / 分享。
        </span>
      </Paragraph>

      <h3 className="mt-4 text-lg md:text-xl font-semibold text-white">
        1. 使用 Meta 广告（Instagram / Facebook）
      </h3>
      <Paragraph>
        通过 Meta 广告把你的 Spotify 歌曲链接精确地投给特定人群，比如：
      </Paragraph>
      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>喜欢某些相似乐队或风格的听众</li>
        <li>某些国家 / 城市的独立音乐爱好者</li>
        <li>已经关注你但还没在 Spotify 听过你的人</li>
      </ul>
      <Paragraph>
        如果广告素材本身做得足够好，听众会在 Spotify 里产生一连串真实行为：
        完整播放、循环、收藏、加入歌单、分享给朋友…… 在算法眼里，这些都在不断提高这首歌的
        SPI，向系统发出一个很明确的信号：
      </Paragraph>
      <Paragraph>
        “这首歌，最近真的有很多人在认真听。”
      </Paragraph>

      <h3 className="mt-4 text-lg md:text-xl font-semibold text-white">
        2. 借助歌单、合作与内容
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>主动联系独立歌单主，把重点歌曲放进相关风格的歌单中</li>
        <li>和其他音乐人、创作者做联名 / 翻唱 / 二创，让他们的听众也接触到你的歌</li>
        <li>在短视频平台、Instagram Reels、TikTok 等渠道持续用同一首歌做内容曝光</li>
      </ul>
      <Paragraph>
        这些做法本质上都在做同一件事：
      </Paragraph>
      <Paragraph>
        <strong>为同一首歌，在同一时间段，制造尽可能多的「高质量互动」。</strong>
        而 SPI，就是把这些互动浓缩到一个数字上的方式。
      </Paragraph>

      <SectionTitle>这个工具能帮你做什么？</SectionTitle>

      <ul className="list-disc space-y-2 pl-5 text-sm md:text-base text-slate-200">
        <li>你可以随时查询任何一位艺人、任何一首歌的当前 SPI；</li>
        <li>可以看到单曲 / 艺人的热门歌曲 SPI 对比；</li>
        <li>
          未来还会逐步显示 SPI 随时间的变化曲线，方便你观察新歌上线首周的走势、某次推广前后的变化，以及哪些歌曲在悄悄「复活」。
        </li>
      </ul>

      <Paragraph>
        我们希望 SPI 对你来说，不只是一个抽象的算法词汇，而是一个：
      </Paragraph>
      <Paragraph>
        <strong>
          可以被看到、被理解、被主动影响的「创作之外的第二战场」。
        </strong>
      </Paragraph>

      <Paragraph>
        接下来，你可以先搜索一下自己的艺人名或歌曲，看看 SPI 目前在哪里站着，从这个数字开始，重新思考你的海外传播策略。
      </Paragraph>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
        >
          返回首页
        </Link>
      </div>
    </article>
  );
}

function EnglishArticle() {
  const locale: Locale = "en";
  return (
    <article className="space-y-4 md:space-y-5">
      <header className="space-y-3 md:space-y-4">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-primary">
          Spotify Popularity Index
        </p>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-semibold text-white">
          What is the Spotify Popularity Index (SPI)?
        </h1>
        <p className="text-sm md:text-base text-slate-300">
          And why it often matters more than total streams
        </p>
      </header>

      <Paragraph>
        If you’ve released music on Spotify and care about how your songs travel
        overseas, there’s one metric you should really understand:{" "}
        <strong className="font-semibold text-white">
          SPI – Spotify Popularity Index
        </strong>
        .
      </Paragraph>

      <Paragraph>
        It doesn’t sound very “musical”, but SPI is basically Spotify’s way of
        answering one question:
      </Paragraph>

      <Paragraph>
        <span className="mt-2 inline-block rounded-2xl bg-slate-800/80 px-3 py-2 text-sm text-slate-100">
          “Right now, how hot is this artist or track?”
        </span>
      </Paragraph>

      <Paragraph>
        Everything else the algorithm does is built on top of that answer.
      </Paragraph>

      <SectionTitle>1. So… what exactly is SPI?</SectionTitle>

      <Paragraph>
        In simple terms,{" "}
        <strong className="font-semibold text-white">
          SPI is a real-time popularity score (0–100)
        </strong>{" "}
        that Spotify assigns to:
      </Paragraph>

      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>each track, and</li>
        <li>your artist profile as a whole.</li>
      </ul>

      <Paragraph>
        The higher the score, the more “momentum” Spotify thinks you have{" "}
        <strong className="font-semibold text-white">right now</strong>.
      </Paragraph>

      <Paragraph>
        The key idea is{" "}
        <strong className="font-semibold text-white">
          “recent activity”, not lifetime success
        </strong>
        .
      </Paragraph>

      <ul className="list-disc space-y-2 pl-5 text-sm md:text-base text-slate-200">
        <li>
          SPI is <strong>not</strong> the same as total streams. A 10-year-old
          song might have 10 million lifetime plays, but if only a handful of
          people listened this month, its SPI can be very low (for example, 5).
        </li>
        <li>
          SPI is much closer to{" "}
          <strong>“how many people are actively into this track lately”</strong>
          . A brand-new song might only have 5,000 streams in total, but if most
          of those came in the last few days, with lots of saves and playlist
          adds, its SPI can quickly jump into the 20s or higher.
        </li>
      </ul>

      <Paragraph>
        Behind the scenes, Spotify is looking at things like:
      </Paragraph>

      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>How many people are playing the song recently</li>
        <li>How often they finish the track instead of skipping</li>
        <li>How many listeners save it or add it to their own playlists</li>
        <li>How many new listeners it’s reaching</li>
      </ul>

      <Paragraph>All of that rolls up into the SPI score.</Paragraph>

      <SectionTitle>2. Why is SPI such a big deal?</SectionTitle>

      <Paragraph>
        Because SPI is one of the key signals the{" "}
        <strong className="font-semibold text-white">Spotify algorithm</strong>{" "}
        uses when deciding:
      </Paragraph>

      <Paragraph>
        <span className="mt-2 inline-block rounded-2xl bg-slate-800/80 px-3 py-2 text-sm text-slate-100">
          “Should I push this song to more people who don’t know this artist
          yet?”
        </span>
      </Paragraph>

      <Paragraph>You can think of it like this:</Paragraph>

      <ul className="list-disc space-y-2 pl-5 text-sm md:text-base text-slate-200">
        <li>
          <strong>When SPI is low (e.g. 0–15)</strong>{" "}
          Spotify basically says:
          <br />
          <span className="inline-block text-slate-300">
            “Okay, some people are listening, but nothing special is happening
            yet.”
          </span>
          <br />
          Your song mostly stays in “invisible mode”: core fans, direct link
          clicks, search results.
        </li>
        <li>
          <strong>When SPI rises (e.g. 20+ and climbing)</strong> Spotify
          suddenly pays attention:
          <br />
          <span className="inline-block text-slate-300">
            “Whoa, this track’s momentum is picking up fast. A lot of people
            seem to like it. Let’s test it with more similar listeners.”
          </span>
        </li>
      </ul>

      <Paragraph>
        That’s when you start to see{" "}
        <strong className="font-semibold text-white">
          free, algorithmic exposure
        </strong>{" "}
        through things like:
      </Paragraph>

      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>Discover Weekly</li>
        <li>Release Radar</li>
        <li>Spotify Radio</li>
        <li>Other algorithmic or personalised playlists</li>
      </ul>

      <Paragraph>
        Once that engine is triggered, your song can reach thousands of
        completely new listeners that you never paid to reach directly. That’s
        the real power of a healthy SPI.
      </Paragraph>

      <SectionTitle>3. What can artists actually do about SPI?</SectionTitle>

      <Paragraph>
        You can’t directly “edit” your SPI score, but you can influence almost
        everything that feeds into it.
      </Paragraph>

      <Paragraph>Here are a few practical things that help:</Paragraph>

      <h3 className="mt-4 text-lg md:text-xl font-semibold text-white">
        1. Strong music & clear branding
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>Good songs, solid production, and recognisable artwork or image</li>
        <li>
          A clear vibe makes it easier for both listeners and the algorithm to
          understand who you are
        </li>
      </ul>

      <h3 className="mt-4 text-lg md:text-xl font-semibold text-white">
        2. Concentrated listening in key windows
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>
          Focus attention around release week or specific promo pushes rather
          than spreading it too thin
        </li>
        <li>
          Encourage fans to save the track, add it to playlists, and share
          links—these actions send much stronger signals than passive
          background plays
        </li>
      </ul>

      <h3 className="mt-4 text-lg md:text-xl font-semibold text-white">
        3. Use off-platform promotion as a “booster”
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>
          Social media posts, short-form videos, collaborations, live clips, and
          email lists can all funnel listeners into Spotify
        </li>
        <li>
          <strong>Meta ads (Instagram/Facebook) and other paid tools</strong>{" "}
          can be used not just to “buy streams”, but to{" "}
          <strong>concentrate high-quality, targeted listeners</strong> into a
          short period of time
        </li>
        <li>
          To Spotify’s system, that looks like: “A lot of the right people are
          suddenly playing, finishing, and saving this track.”
        </li>
      </ul>

      <h3 className="mt-4 text-lg md:text-xl font-semibold text-white">
        4. Keep a steady “heartbeat” after release
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm md:text-base text-slate-200">
        <li>
          SPI is about recent activity, so a song that keeps getting small waves
          of attention will stay healthier for longer
        </li>
        <li>
          Think in “chapters”: release → visual content → live videos → remixes
          → playlist pushes, etc.
        </li>
      </ul>

      <Paragraph>
        Over time, these actions don’t just improve one song’s SPI—they help
        Spotify understand that{" "}
        <strong className="font-semibold text-white">
          you as an artist
        </strong>{" "}
        are consistently bringing in engaged listeners. That’s how you build
        long-term trust with the algorithm.
      </Paragraph>

      <SectionTitle>4. Quick recap</SectionTitle>

      <ul className="list-disc space-y-2 pl-5 text-sm md:text-base text-slate-200">
        <li>
          <strong>SPI = real-time popularity</strong>, not lifetime streams.
        </li>
        <li>
          A high or rising SPI makes it{" "}
          <strong>much more likely</strong> that Spotify will recommend your
          music via Discover Weekly, Release Radar, Radio, and other algorithmic
          playlists.
        </li>
        <li>
          Promotion tools (including Meta ads) are most useful when you treat
          them as a way to{" "}
          <strong>generate concentrated, high-quality activity</strong> that
          pushes SPI upward.
        </li>
        <li>
          You’re not just chasing one-off plays—you’re building a{" "}
          <strong>signal</strong> that tells Spotify:
          <br />
          <span className="inline-block text-slate-300">
            “This artist is worth showing to more people.”
          </span>
        </li>
      </ul>

      <Paragraph>
        If you care about growing on Spotify, watching and improving your SPI is
        one of the most powerful things you can do.
      </Paragraph>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
        >
          {t(locale, "backToHome")}
        </Link>
      </div>
    </article>
  );
}
