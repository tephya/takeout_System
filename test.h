class Avd_DedLc {
public:
    int** MAX;        // 最大需求矩阵，表示每个进程对各类资源的最大需求
    int** Allocation; // 分配矩阵，表示每个进程当前已分配的各类资源数量
    int** Need;       // 需求矩阵，表示每个进程还需要的各类资源数量
    int* Available;   // 可用资源向量，表示系统中每类资源的可用数量
    int* Work;        // 工作向量，用于安全性算法
    bool* Finish;     // 完成向量，用于安全性算法
    bool* Complete;   // 进程完成标志，表示进程是否已完成执行
    bool* Clog;       // 阻塞标记，标记进程是否被阻塞
    int* SafeSq;      // 安全序列数组
    int CompleteNum;  // 已完成的进程数量
    bool ExistSaveSq; // 存在安全序列的标志
    
    // 构造函数和方法
    Avd_DedLc(int N, int M);
    void Free(int N, int M);
    void Resize(int oldN, int newN, int M);
    int GetTotalNeedForProcess(int procIndex, int M);
};
